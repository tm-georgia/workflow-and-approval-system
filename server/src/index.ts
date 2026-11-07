import express from "express";
import { prisma } from "./prisma";

const app = express();
app.use(express.json());

app.get("/api/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ok", database: "connected" });
  } catch {
    response.status(500).json({ status: "error", database: "disconnected" });
  }
});

const port = 3000;

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});