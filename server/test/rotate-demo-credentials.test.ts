import { spawnSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/prisma";

// Synthetic fixtures only, inside scripts/test-local.mjs's disposable cluster.
const requesterEmail = "lab5-requester@example.test";
const reviewerEmail = "lab5-reviewer@example.test";
const oldPassword = "synthetic-old-rotation-fixture";
const replacementRequester = "synthetic-new-requester-fixture";
const replacementReviewer = "synthetic-new-reviewer-fixture";
const emails = [requesterEmail, reviewerEmail];
const title = "[ROTATION TEST] retained request";

function rotate(overrides: Record<string, string | undefined> = {}) {
  const result = spawnSync(process.execPath, ["--import", "tsx", "prisma/rotate-demo-credentials.ts"], {
    cwd: process.cwd(), encoding: "utf8", windowsHide: true, timeout: 30_000,
    env: { ...process.env, ROTATION_CONFIRMATION: "rotate-existing-lab5-demo-accounts",
      REQUESTER_PASSWORD: replacementRequester, REVIEWER_PASSWORD: replacementReviewer, ...overrides },
  });
  if (result.error) throw result.error;
  const output = result.stdout + result.stderr;
  for (const value of [oldPassword, replacementRequester, replacementReviewer]) {
    expect(output.includes(value)).toBe(false);
  }
  expect(output.includes("$2b$")).toBe(false);
  expect(output.includes("postgresql://")).toBe(false);
  return { status: result.status, output };
}

async function removeFixtures() {
  await prisma.request.deleteMany({ where: { title } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

beforeEach(removeFixtures);
afterAll(async () => { await removeFixtures(); await prisma.$disconnect(); });

async function fixtures() {
  const passwordHash = await bcrypt.hash(oldPassword, 12);
  const requester = await prisma.user.create({ data: { email: requesterEmail, role: "REQUESTER", passwordHash } });
  const reviewer = await prisma.user.create({ data: { email: reviewerEmail, role: "REVIEWER", passwordHash } });
  const saved = await prisma.request.create({ data: { title, description: "Retained business record", requesterId: requester.id,
    assignedReviewerId: reviewer.id, reviewerId: reviewer.id, status: "APPROVED", decidedAt: new Date("2026-01-01T00:00:00Z") } });
  return { requester, reviewer, saved };
}

describe("one-off demonstration credential rotation", () => {
  it("atomically changes two hashes, preserves identities and requests, and safely recognizes the same completed versions", async () => {
    const before = await fixtures();
    expect(rotate().status).toBe(0);
    const requester = await prisma.user.findUniqueOrThrow({ where: { email: requesterEmail } });
    const reviewer = await prisma.user.findUniqueOrThrow({ where: { email: reviewerEmail } });
    expect({ ...requester, passwordHash: "omitted" }).toEqual({ ...before.requester, passwordHash: "omitted" });
    expect({ ...reviewer, passwordHash: "omitted" }).toEqual({ ...before.reviewer, passwordHash: "omitted" });
    expect(await bcrypt.compare(replacementRequester, requester.passwordHash)).toBe(true);
    expect(await bcrypt.compare(replacementReviewer, reviewer.passwordHash)).toBe(true);
    expect(bcrypt.getRounds(requester.passwordHash)).toBe(12);
    expect(bcrypt.getRounds(reviewer.passwordHash)).toBe(12);
    expect(await bcrypt.compare(oldPassword, requester.passwordHash)).toBe(false);
    expect(await bcrypt.compare(oldPassword, reviewer.passwordHash)).toBe(false);
    expect(await prisma.request.findUniqueOrThrow({ where: { id: before.saved.id } })).toEqual(before.saved);
    expect(rotate().status).toBe(0);
    const repeated = await prisma.user.findUniqueOrThrow({ where: { email: requesterEmail } });
    expect(repeated.passwordHash === requester.passwordHash).toBe(true);
  // Cost-12 hashing plus two subprocess invocations is intentionally expensive.
  // Keep all assertions and the production work factor; allow slower CI CPUs.
  }, 20_000);

  it("refuses mismatched roles without changing either credential", async () => {
    const before = await fixtures();
    await prisma.user.update({ where: { id: before.reviewer.id }, data: { role: "REQUESTER" } });
    expect(rotate().status).toBe(1);
    for (const email of emails) {
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(user.passwordHash === before.requester.passwordHash).toBe(true);
    }
  });

  it("rolls back both updates if database read-back does not retain the supplied hashes", async () => {
    const before = await fixtures();
    // Synthetic trigger in this disposable cluster simulates an unexpected DB
    // transformation; it is always removed and never part of production SQL.
    await prisma.$executeRawUnsafe(`CREATE FUNCTION public.lab5_rotation_test_retain_hash() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW."passwordHash" := OLD."passwordHash"; RETURN NEW; END $$`);
    try {
      await prisma.$executeRawUnsafe(`CREATE TRIGGER lab5_rotation_test_retain_hash BEFORE UPDATE OF "passwordHash" ON public."User" FOR EACH ROW EXECUTE FUNCTION public.lab5_rotation_test_retain_hash()`);
      expect(rotate().status).toBe(1);
      const requester = await prisma.user.findUniqueOrThrow({ where: { email: requesterEmail } });
      const reviewer = await prisma.user.findUniqueOrThrow({ where: { email: reviewerEmail } });
      expect(requester.passwordHash === before.requester.passwordHash).toBe(true);
      expect(reviewer.passwordHash === before.reviewer.passwordHash).toBe(true);
      expect(await prisma.request.findUniqueOrThrow({ where: { id: before.saved.id } })).toEqual(before.saved);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS lab5_rotation_test_retain_hash ON public."User"');
      await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS public.lab5_rotation_test_retain_hash()');
    }
  });

  it.each([
    { ROTATION_CONFIRMATION: "" }, { REQUESTER_PASSWORD: "short" },
    { REVIEWER_PASSWORD: replacementRequester }, { REVIEWER_PASSWORD: "x".repeat(73) },
    { REVIEWER_PASSWORD: "\u00e9".repeat(37) }, { REQUESTER_PASSWORD: oldPassword },
  ])("fails closed for invalid or partly reused replacement inputs (case %#)", async (overrides) => {
    const before = await fixtures();
    expect(rotate(overrides).status).toBe(1);
    const requester = await prisma.user.findUniqueOrThrow({ where: { email: requesterEmail } });
    const reviewer = await prisma.user.findUniqueOrThrow({ where: { email: reviewerEmail } });
    expect(requester.passwordHash === before.requester.passwordHash).toBe(true);
    expect(reviewer.passwordHash === before.reviewer.passwordHash).toBe(true);
  });
});
