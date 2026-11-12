import express from "express";
import type { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { prisma } from "./prisma";
import { authRouter } from "./auth";
import { requestRouter } from "./requests";
import { reviewerRouter } from "./reviewer";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/requests", requestRouter);
app.use("/api/requests", reviewerRouter);

app.get("/api/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ok", database: "connected" });
  } catch {
    response.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const malformed = error instanceof SyntaxError && "status" in error && error.status === 400;
  response.status(malformed ? 400 : 500).json({ error: malformed ? "Send a valid JSON body." : "Could not complete the request." });
});
