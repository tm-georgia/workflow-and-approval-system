import { Router } from "express";
import type { Request, Response } from "express";
import { parseRequestId } from "./reviewer-rules";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";
import { requireAuth, requireRole, type AuthRequest } from "./auth";

export const requestRouter = Router();

const ownerHistory = {
  history: { orderBy: [{ occurredAt: "asc" }, { id: "asc" }] },
} satisfies Prisma.RequestInclude;

function purchaseDetails(body?: { title?: unknown; description?: unknown } | null) {
  const { title, description } = body ?? {};
  if (typeof title !== "string" || typeof description !== "string" || !title.trim() || !description.trim()) return null;
  return { title: title.trim(), description: description.trim() };
}

requestRouter.post(
  "/",
  requireAuth,
  requireRole("REQUESTER"),
  async (request: Request, response: Response): Promise<void> => {
    const fields = purchaseDetails(request.body);
    if (!fields) {
      response.status(400).json({
        error: "Enter both a title and description.",
      });
      return;
    }

    try {
      const user = (request as AuthRequest).currentUser!;

      const assignedReviewer = await prisma.user.findUnique({
        where: { email: process.env.DESIGNATED_REVIEWER_EMAIL ?? "reviewer@example.test" },
        select: { id: true, role: true },
      });
      if (!assignedReviewer || assignedReviewer.role !== "REVIEWER") {
        response.status(503).json({ error: "Request submission is unavailable until a Reviewer is configured." });
        return;
      }

      const savedRequest = await prisma.request.create({
        data: {
          ...fields,
          requesterId: user.id,
          assignedReviewerId: assignedReviewer.id,
        },
      });

      response.status(201).json(savedRequest);
    } catch {
      response.status(500).json({ error: "Could not save the request." });
    }
  }
);

requestRouter.patch("/:id/resubmit", requireAuth, requireRole("REQUESTER"), async (request, response): Promise<void> => {
  const id = parseRequestId(request.params.id);
  if (id === null) {
    response.status(400).json({ error: "Use a valid request ID." });
    return;
  }
  const ownerId = (request as AuthRequest).currentUser!.id;
  const conflict = { status: 409, error: "Only a returned request can be resubmitted." } as const;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.request.findUnique({ where: { id }, select: { requesterId: true, status: true } });
      if (!current) return { status: 404, error: "Request not found." } as const;
      if (current.requesterId !== ownerId) return { status: 403, error: "You may revise only your own requests." } as const;
      if (current.status !== "RETURNED") return conflict;
      const fields = purchaseDetails(request.body);
      if (!fields) return { status: 400, error: "Enter both a title and description." } as const;

      const updated = await tx.request.updateMany({
        where: { id, requesterId: ownerId, status: "RETURNED" },
        data: { ...fields, status: "PENDING", reviewerId: null, decidedAt: null },
      });
      if (updated.count !== 1) return conflict;
      await tx.reviewEvent.create({
        data: { requestId: id, actorId: ownerId, action: "RESUBMITTED", occurredAt: new Date(), reason: null },
      });
      const record = await tx.request.findUniqueOrThrow({ where: { id }, include: ownerHistory });
      return { status: 200, record } as const;
    });
    if (result.status === 200) response.json(result.record);
    else response.status(result.status).json({ error: result.error });
  } catch {
    response.status(500).json({ error: "Could not resubmit the request." });
  }
});

requestRouter.get(
  "/mine",
  requireAuth,
  requireRole("REQUESTER"),
  async (request: Request, response: Response): Promise<void> => {
    try {
      const user = (request as AuthRequest).currentUser!;

      const requests = await prisma.request.findMany({
        where: { requesterId: user.id },
        include: ownerHistory,
        orderBy: { createdAt: "desc" },
      });

      response.json(requests);
    } catch {
      response.status(500).json({ error: "Could not load your requests." });
    }
  }
);
