import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "./auth";
import { prisma } from "./prisma";
import { isDecision, mayReview, parseRequestId } from "./reviewer-rules";

export const reviewerRouter = Router();
reviewerRouter.use(requireAuth, requireRole("REVIEWER"));

reviewerRouter.get("/pending", async (request, response): Promise<void> => {
  const user = (request as AuthRequest).currentUser!;
  try {
    const pending = await prisma.request.findMany({
      where: { status: "PENDING", assignedReviewerId: user.id, requesterId: { not: user.id } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    response.json(pending);
  } catch {
    response.status(500).json({ error: "Could not load pending requests." });
  }
});

const alreadyDecided = { status: 409, error: "This request has already been decided. Refresh the pending list." } as const;

reviewerRouter.patch("/:id/decision", async (request, response): Promise<void> => {
  const id = parseRequestId(request.params.id);
  const decision: unknown = request.body?.decision;
  if (id === null || !isDecision(decision)) {
    response.status(400).json({ error: "Use a valid request ID and an APPROVED, REJECTED or RETURNED decision." });
    return;
  }
  const user = (request as AuthRequest).currentUser!;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.request.findUnique({ where: { id } });
      if (!existing) return { status: 404, error: "Request not found." } as const;
      if (!mayReview(user.id, existing)) return { status: 403, error: "You may review only assigned requests that you do not own." } as const;

      if (existing.status !== "PENDING") return alreadyDecided;
      const rawReason: unknown = request.body.reason;
      const reason = typeof rawReason === "string" ? rawReason.trim() : "";
      if (!reason) {
        const label = decision === "APPROVED" ? "approval" : decision === "RETURNED" ? "return" : "rejection";
        return { status: 400, error: `Provide a reason for ${label}.` } as const;
      }

      // The status, assignment and ownership checks occur in the SQL write, not
      // only in the earlier read. Concurrent attempts cannot both change Pending.
      const decidedAt = new Date();
      const changed = await tx.request.updateMany({
        where: { id, status: "PENDING", assignedReviewerId: user.id, requesterId: { not: user.id } },
        data: { status: decision, reviewerId: user.id, decidedAt },
      });
      if (changed.count !== 1) {
        const current = await tx.request.findUnique({ where: { id } });
        if (!current) return { status: 404, error: "Request not found." } as const;
        if (!mayReview(user.id, current)) return { status: 403, error: "You may review only assigned requests that you do not own." } as const;
        return alreadyDecided;
      }
      await tx.reviewEvent.create({
        data: { requestId: id, actorId: user.id, action: decision, occurredAt: decidedAt, reason },
      });
      return { status: 200, record: await tx.request.findUniqueOrThrow({ where: { id } }) } as const;
    });
    if (result.status === 200) response.json(result.record);
    else response.status(result.status).json({ error: result.error });
  } catch {
    response.status(500).json({ error: "Could not save the decision." });
  }
});
