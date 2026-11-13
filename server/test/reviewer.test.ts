import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Client } from "pg";
import { setTimeout as delay } from "node:timers/promises";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

const password = "SyntheticF03TestOnly!";
const owner = request.agent(app);
const reviewer = request.agent(app);
const unrelated = request.agent(app);
const selfReviewer = request.agent(app);
let ownerId: number;
let reviewerId: number;
let unrelatedId: number;
let selfId: number;

beforeAll(async () => {
  const hash = await bcrypt.hash(password, 4);
  const ownerUser = await prisma.user.create({ data: { email: "owner-f03@example.test", passwordHash: hash, role: "REQUESTER" } });
  const reviewerUser = await prisma.user.findUniqueOrThrow({ where: { email: "reviewer@example.test" } });
  const unrelatedUser = await prisma.user.create({ data: { email: "unrelated-f03@example.test", passwordHash: hash, role: "REVIEWER" } });
  // Models a Requester whose role changed after they submitted a request.
  const selfUser = await prisma.user.create({ data: { email: "self-f03@example.test", passwordHash: hash, role: "REVIEWER" } });
  ownerId = ownerUser.id; reviewerId = reviewerUser.id; unrelatedId = unrelatedUser.id; selfId = selfUser.id;
  await owner.post("/api/auth/login").send({ email: ownerUser.email, password }).expect(200);
  await reviewer.post("/api/auth/login").send({ email: reviewerUser.email, password: "ReviewerDemo334!" }).expect(200);
  await unrelated.post("/api/auth/login").send({ email: unrelatedUser.email, password }).expect(200);
  await selfReviewer.post("/api/auth/login").send({ email: selfUser.email, password }).expect(200);
});
afterAll(async () => { await prisma.$disconnect(); });

function createPending(assignedReviewerId: number | null = reviewerId, requesterId = ownerId) {
  return prisma.request.create({ data: { title: "Synthetic F03 request", description: "Review integration fixture", requesterId, assignedReviewerId } });
}
function decide(agent: typeof reviewer, id: number | string, decision: unknown = "APPROVED") {
  return agent.patch(`/api/requests/${id}/decision`).send({ decision });
}

describe("F-03 real API/PostgreSQL workflow", () => {
  it("TEST-F03-01: lists only assigned non-self-owned Pending records", async () => {
    const mine = await createPending();
    const other = await createPending(unrelatedId);
    const legacy = await createPending(null);
    const self = await createPending(reviewerId, reviewerId);
    const completed = await prisma.request.create({ data: { title: "Already completed", description: "Hidden from pending", requesterId: ownerId, assignedReviewerId: reviewerId, status: "APPROVED", reviewerId, decidedAt: new Date() } });
    const response = await reviewer.get("/api/requests/pending").expect(200);
    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: mine.id, status: "PENDING" })]));
    const ids = response.body.map((item: { id: number }) => item.id);
    for (const excluded of [other, legacy, self, completed]) expect(ids).not.toContain(excluded.id);
    expect(response.body.every((item: { assignedReviewerId: number; requesterId: number; status: string }) => item.assignedReviewerId === reviewerId && item.requesterId !== reviewerId && item.status === "PENDING")).toBe(true);
    expect(response.body[0]).not.toHaveProperty("passwordHash");
  });

  it.each(["APPROVED", "REJECTED"])("TEST-F03-02/03/04: persists %s with session identity and owner retrieval", async (decision) => {
    const pending = await createPending();
    const before = Date.now();
    const result = await reviewer.patch(`/api/requests/${pending.id}/decision`).send({ decision, reviewerId: unrelatedId, requesterId: unrelatedId, assignedReviewerId: unrelatedId, decidedAt: "2000-01-01" }).expect(200);
    expect(result.body).toMatchObject({ id: pending.id, status: decision, reviewerId, requesterId: ownerId, assignedReviewerId: reviewerId });
    expect(Date.parse(result.body.decidedAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(result.body.decidedAt)).toBeLessThanOrEqual(Date.now());
    const saved = await prisma.request.findUniqueOrThrow({ where: { id: pending.id } });
    expect(saved.status).toBe(decision);
    expect(saved.reviewerId).toBe(reviewerId);
    expect(saved.decidedAt?.toISOString()).toBe(result.body.decidedAt);
    const history = await owner.get("/api/requests/mine").expect(200);
    expect(history.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: pending.id, status: decision, reviewerId, decidedAt: result.body.decidedAt })]));
    const list = await reviewer.get("/api/requests/pending").expect(200);
    expect(list.body.map((item: { id: number }) => item.id)).not.toContain(pending.id);
  });

  it("TEST-F03-05: both operations reject signed-out and wrong-role access", async () => {
    const pending = await createPending();
    for (const [agent, code] of [[request.agent(app), 401], [owner, 403]] as const) {
      const list = await agent.get("/api/requests/pending").expect(code);
      const decision = await decide(agent, pending.id).expect(code);
      expect(list.body).not.toHaveProperty("title");
      expect(decision.body).not.toHaveProperty("title");
    }
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
  });

  it.each(["APPROVED", "REJECTED"])("TEST-F03-06: refuses to replace an existing %s decision", async (first) => {
    const pending = await createPending();
    await decide(reviewer, pending.id, first).expect(200);
    const saved = await prisma.request.findUnique({ where: { id: pending.id } });
    await decide(reviewer, pending.id, first === "APPROVED" ? "REJECTED" : "APPROVED").expect(409);
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(saved);
  });

  it.each(["0", "-1", "1.5", "1e2", "01", "abc", "2147483648"])("TEST-F03-07-ID: rejects invalid ID %s", async (id) => {
    await decide(reviewer, id).expect(400);
  });
  it.each([null, "PENDING", "approved", "", 1, {}, ["APPROVED"]].map((value) => ({ value })))("TEST-F03-07-VALUE: refuses invalid decision %j without mutation", async ({ value }) => {
    const pending = await createPending();
    await decide(reviewer, pending.id, value).expect(400);
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
  });
  it("TEST-F03-07-MISSING: rejects missing decision and unknown record", async () => {
    const pending = await createPending();
    await reviewer.patch(`/api/requests/${pending.id}/decision`).send({}).expect(400);
    await decide(reviewer, 2147483647).expect(404);
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
  });

  it("TEST-F03-08: concurrent decisions have exactly one winner and preserve its metadata", async () => {
    const pending = await createPending();
    const blocker = new Client({ connectionString: process.env.DATABASE_URL });
    const monitor = new Client({ connectionString: process.env.DATABASE_URL });
    let locked = false;
    let resultsPromise: Promise<Awaited<ReturnType<typeof decide>>[]> | undefined;
    let results: Awaited<ReturnType<typeof decide>>[];
    try {
      await blocker.connect();
      await monitor.connect();
      await blocker.query("BEGIN");
      locked = true;
      await blocker.query('SELECT "id" FROM "Request" WHERE "id" = $1 FOR UPDATE', [pending.id]);
      const lockOwner = (await blocker.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      resultsPromise = Promise.all([decide(reviewer, pending.id, "APPROVED"), decide(reviewer, pending.id, "REJECTED")]);
      // Observe both actual UPDATE sessions waiting, including indirect tuple-lock
      // waiters. Ordinary reads can see Pending while this row lock is held.
      void resultsPromise.catch(() => {});
      let waitingPids: number[] = [];
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        const waiting = await monitor.query<{ pid: number }>(`
          WITH RECURSIVE blocked(pid) AS (
            SELECT pid FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))
            UNION
            SELECT a.pid FROM pg_stat_activity a JOIN blocked b ON b.pid = ANY(pg_blocking_pids(a.pid))
          )
          SELECT a.pid FROM blocked b JOIN pg_stat_activity a ON a.pid = b.pid
          WHERE a.state = 'active' AND a.wait_event_type = 'Lock'
            AND a.query LIKE 'UPDATE%"Request"%'
        `, [lockOwner]);
        waitingPids = [...new Set(waiting.rows.map((row) => row.pid))];
        if (waitingPids.length === 2) break;
        await delay(25);
      }
      expect(waitingPids).toHaveLength(2);
      console.info("TEST-F03-08 barrier: observed two distinct PostgreSQL UPDATE sessions waiting on the held request lock.");
      await blocker.query("COMMIT");
      locked = false;
      results = await resultsPromise;
    } finally {
      if (locked) await blocker.query("ROLLBACK");
      if (resultsPromise) await Promise.allSettled([resultsPromise]);
      await Promise.all([blocker.end(), monitor.end()]);
    }
    expect(results.map((response) => response.status).sort()).toEqual([200, 409]);
    const winner = results.find((response) => response.status === 200)!;
    const saved = await prisma.request.findUniqueOrThrow({ where: { id: pending.id } });
    expect(saved.status).toBe(winner.body.status);
    expect(saved.reviewerId).toBe(reviewerId);
    expect(saved.decidedAt?.toISOString()).toBe(winner.body.decidedAt);
  }, 15000);

  it("TEST-F03-10: unrelated Reviewers cannot list or decide another assignment", async () => {
    const pending = await createPending();
    const list = await unrelated.get("/api/requests/pending").expect(200);
    expect(list.body.map((item: { id: number }) => item.id)).not.toContain(pending.id);
    const denied = await decide(unrelated, pending.id).expect(403);
    expect(denied.body).toEqual({ error: expect.any(String) });
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
    const legacy = await createPending(null);
    await decide(reviewer, legacy.id).expect(403);
  });

  it("TEST-F03-11: self-approval is refused even after a role change", async () => {
    const own = await createPending(selfId, selfId);
    const list = await selfReviewer.get("/api/requests/pending").expect(200);
    expect(list.body.map((item: { id: number }) => item.id)).not.toContain(own.id);
    await decide(selfReviewer, own.id).expect(403);
    expect(await prisma.request.findUnique({ where: { id: own.id } })).toEqual(own);
  });

  it("TEST-F03-10-SUBMIT: server assigns the designated Reviewer and ignores spoofed identities", async () => {
    const created = await owner.post("/api/requests").send({ title: "Assigned by server", description: "No client assignment", assignedReviewerId: unrelatedId, reviewerId: unrelatedId, requesterId: unrelatedId }).expect(201);
    expect(created.body).toMatchObject({ requesterId: ownerId, assignedReviewerId: reviewerId, reviewerId: null, decidedAt: null, status: "PENDING" });
  });

  it("TEST-F03-10-UNAVAILABLE: missing designated Reviewer refuses submission without saving", async () => {
    const previous = process.env.DESIGNATED_REVIEWER_EMAIL;
    process.env.DESIGNATED_REVIEWER_EMAIL = "missing@example.test";
    try {
      const before = await prisma.request.count();
      await owner.post("/api/requests").send({ title: "Must not be saved", description: "No assigned Reviewer" }).expect(503);
      expect(await prisma.request.count()).toBe(before);
    } finally { process.env.DESIGNATED_REVIEWER_EMAIL = previous; }
  });

  it("TEST-F02-OWNERSHIP: another Requester cannot see the owner's request or saved decision", async () => {
    const pending = await createPending();
    await decide(reviewer, pending.id).expect(200);
    const stranger = request.agent(app);
    await stranger.post("/api/auth/login").send({ email: "requester@example.test", password: "RequesterDemo334!" }).expect(200);
    const list = await stranger.get("/api/requests/mine").expect(200);
    expect(list.body.map((item: { id: number }) => item.id)).not.toContain(pending.id);
  });

  it("TEST-F03-EMPTY: a Reviewer without assigned work receives an empty list", async () => {
    await selfReviewer.get("/api/requests/pending").expect(200, []);
  });

  it("TEST-F03-ERROR: database failures produce safe errors and do not save decisions", async () => {
    const pending = await createPending();
    const listSpy = vi.spyOn(prisma.request, "findMany").mockRejectedValueOnce(new Error("Internal fixture details"));
    try { await reviewer.get("/api/requests/pending").expect(500, { error: "Could not load pending requests." }); }
    finally { listSpy.mockRestore(); }
    const transactionSpy = vi.spyOn(prisma, "$transaction").mockRejectedValueOnce(new Error("Internal fixture details"));
    try { await decide(reviewer, pending.id).expect(500, { error: "Could not save the decision." }); }
    finally { transactionSpy.mockRestore(); }
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
  });

  it("TEST-F03-JSON: malformed JSON returns a safe validation error", async () => {
    const pending = await createPending();
    await reviewer.patch(`/api/requests/${pending.id}/decision`).set("Content-Type", "application/json").send('{"decision":').expect(400, { error: "Send a valid JSON body." });
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
  });

  it("TEST-F03-SESSION: invalid, expired, and unknown-user sessions cannot review", async () => {
    const pending = await createPending();
    const secret = process.env.JWT_SECRET!;
    const tokens = ["invalid-session", jwt.sign({ userId: reviewerId }, secret, { expiresIn: -1 }), jwt.sign({ userId: 2147483647 }, secret, { expiresIn: 60 })];
    for (const token of tokens) {
      await request(app).get("/api/requests/pending").set("Cookie", `accessToken=${token}`).expect(401);
      await request(app).patch(`/api/requests/${pending.id}/decision`).set("Cookie", `accessToken=${token}`).send({ decision: "APPROVED" }).expect(401);
    }
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
  });

  it("TEST-F03-10-WRONG-ROLE: a designated account without Reviewer role cannot receive submissions", async () => {
    const previous = process.env.DESIGNATED_REVIEWER_EMAIL;
    process.env.DESIGNATED_REVIEWER_EMAIL = "owner-f03@example.test";
    try {
      const before = await prisma.request.count();
      await owner.post("/api/requests").send({ title: "Not authorized to review", description: "Must not be saved" }).expect(503);
      expect(await prisma.request.count()).toBe(before);
    } finally { process.env.DESIGNATED_REVIEWER_EMAIL = previous; }
  });

  it.each([{ title: "", description: "valid" }, { title: "valid" }, { title: "valid", description: "  " }, { title: 12, description: "valid" }])("TEST-F02-VALIDATION: invalid required fields do not save %j", async (input) => {
    const before = await prisma.request.count();
    await owner.post("/api/requests").send(input).expect(400);
    expect(await prisma.request.count()).toBe(before);
  });
});
