import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

const testPrefix = `[TEST] ${Date.now()}`;

afterAll(async () => {
  await prisma.request.deleteMany({
    where: { title: { startsWith: testPrefix } },
  });
  await prisma.$disconnect();
});

describe("authentication and Requester requests", () => {
  it("TEST-01: rejects a signed-out request submission", async () => {
    await request(app)
      .post("/api/requests")
      .send({ title: "Not signed in", description: "Should be refused" })
      .expect(401);
  });

  it("TEST-02: rejects an incorrect password", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({
        email: "requester@example.test",
        password: "wrong-demo-password",
      })
      .expect(401);
  });

  it("TEST-03: Requester saves and retrieves their own Pending request", async () => {
    const requester = request.agent(app);

    const login = await requester
      .post("/api/auth/login")
      .send({
        email: "requester@example.test",
        password: "RequesterDemo334!",
      })
      .expect(200);

    const created = await requester
      .post("/api/requests")
      .send({
        title: `${testPrefix} saved request`,
        description: "Automated persistence check",
        requesterId: 999999,
      })
      .expect(201);

    expect(created.body.status).toBe("PENDING");
    expect(created.body.requesterId).toBe(login.body.id);

    const list = await requester.get("/api/requests/mine").expect(200);

    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.body.id,
          title: `${testPrefix} saved request`,
          status: "PENDING",
        }),
      ])
    );

    await requester
      .post("/api/requests")
      .send({ title: "", description: "Missing title" })
      .expect(400);

    await requester.post("/api/auth/logout").expect(204);
    await requester.get("/api/auth/me").expect(401);
  });

  it("TEST-04: refuses to let a Reviewer use the Requester-only list", async () => {
    const reviewer = request.agent(app);

    await reviewer
      .post("/api/auth/login")
      .send({
        email: "reviewer@example.test",
        password: "ReviewerDemo334!",
      })
      .expect(200);

    await reviewer.get("/api/requests/mine").expect(403);
  });

  it("TEST-AUTH-ME-01: returns the signed-in user's current identity", async () => {
  const requester = request.agent(app);

  const login = await requester
    .post("/api/auth/login")
    .send({
      email: "requester@example.test",
      password: "RequesterDemo334!",
    })
       .expect(200);

  expect(login.body).toMatchObject({
    id: expect.any(Number),
    email: "requester@example.test",
    role: "REQUESTER",
  });

  const me = await requester.get("/api/auth/me").expect(200);

  expect(me.body).toMatchObject({
    id: login.body.id,
    email: "requester@example.test",
    role: "REQUESTER",
  });
});

it("TEST-AUTH-INVALID-01: invalid login does not create a session", async () => {
  const requester = request.agent(app);

  await requester
    .post("/api/auth/login")
    .send({
      email: "requester@example.test",
      password: "incorrect-test-password",
    })
    .expect(401);

  await requester.get("/api/auth/me").expect(401);
});
});