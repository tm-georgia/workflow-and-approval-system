import express from "express";
import cookieParser from "cookie-parser";
import { prisma } from "./prisma";
import { authRouter } from "./auth";
import { requestRouter } from "./requests";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/requests", requestRouter);

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