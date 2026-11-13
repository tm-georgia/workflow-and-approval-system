import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "./prisma";
import { requireAuth, requireRole, type AuthRequest } from "./auth";

export const requestRouter = Router();

requestRouter.post(
  "/",
  requireAuth,
  requireRole("REQUESTER"),
  async (request: Request, response: Response): Promise<void> => {
    const { title, description } = request.body ?? {};

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      !title.trim() ||
      !description.trim()
    ) {
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
          title: title.trim(),
          description: description.trim(),
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

requestRouter.get(
  "/mine",
  requireAuth,
  requireRole("REQUESTER"),
  async (request: Request, response: Response): Promise<void> => {
    try {
      const user = (request as AuthRequest).currentUser!;

      const requests = await prisma.request.findMany({
        where: { requesterId: user.id },
        orderBy: { createdAt: "desc" },
      });

      response.json(requests);
    } catch {
      response.status(500).json({ error: "Could not load your requests." });
    }
  }
);
