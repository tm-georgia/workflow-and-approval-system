import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/health", () => {
  it("returns 200 when the database is connected", async () => {
    const response = await request(app)
      .get("/api/health")
      .expect(200);

    expect(response.body).toEqual({
      status: "ok",
      database: "connected",
    });
  });

  it("returns 500 when the database query fails", async () => {
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(
      new Error("Simulated database connection failure")
    );

    const response = await request(app)
      .get("/api/health")
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      database: "disconnected",
    });
  });
});
