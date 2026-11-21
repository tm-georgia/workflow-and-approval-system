import { spawnSync } from "node:child_process";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma";

// These are synthetic fixtures used only by the isolated test-cluster runner.
const requesterEmail = "provision-requester@example.test";
const reviewerEmail = "provision-reviewer@example.test";
const requesterPassword = "synthetic-requester-fixture-only";
const reviewerPassword = "synthetic-reviewer-fixture-only";
const emails = [requesterEmail, reviewerEmail];

function provision(overrides: Record<string, string | undefined> = {}) {
  const result = spawnSync(process.execPath, ["--import", "tsx", "prisma/provision-users.ts"], {
    cwd: process.cwd(), timeout: 30_000, windowsHide: true, encoding: "utf8",
    env: { ...process.env, REQUESTER_EMAIL: requesterEmail, REVIEWER_EMAIL: reviewerEmail,
      REQUESTER_PASSWORD: requesterPassword, REVIEWER_PASSWORD: reviewerPassword, ...overrides },
  });
  if (result.error) throw result.error;
  // Assertions must never include fixture passwords, hashes, or connection strings.
  expect((result.stdout + result.stderr).includes(requesterPassword)).toBe(false);
  expect((result.stdout + result.stderr).includes(reviewerPassword)).toBe(false);
  return result.status;
}

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
});

describe("deployment account provisioning", () => {
  it("creates both roles with independently hashed supplied passwords", async () => {
    expect(provision({ REQUESTER_EMAIL: "  PROVISION-REQUESTER@EXAMPLE.TEST  " })).toBe(0);
    const requester = await prisma.user.findUniqueOrThrow({ where: { email: requesterEmail } });
    const reviewer = await prisma.user.findUniqueOrThrow({ where: { email: reviewerEmail } });
    expect(requester.role).toBe("REQUESTER");
    expect(reviewer.role).toBe("REVIEWER");
    expect(await bcrypt.compare(requesterPassword, requester.passwordHash)).toBe(true);
    expect(await bcrypt.compare(reviewerPassword, reviewer.passwordHash)).toBe(true);
  });

  it("rolls back the first insert when the reviewer email already exists", async () => {
    const existing = await prisma.user.create({ data: { email: reviewerEmail,
      passwordHash: await bcrypt.hash("synthetic-existing-fixture-only", 12), role: "REQUESTER" } });
    expect(provision()).toBe(1);
    expect(await prisma.user.findUnique({ where: { email: requesterEmail } })).toBeNull();
    const current = await prisma.user.findUniqueOrThrow({ where: { email: reviewerEmail } });
    expect(current.passwordHash === existing.passwordHash).toBe(true);
    expect(current.role).toBe("REQUESTER");
  });

  it("refuses repeat execution without changing existing accounts", async () => {
    expect(provision()).toBe(0);
    const before = await prisma.user.findMany({ where: { email: { in: emails } }, orderBy: { email: "asc" } });
    expect(provision({ REQUESTER_PASSWORD: "synthetic-different-fixture-only" })).toBe(1);
    const after = await prisma.user.findMany({ where: { email: { in: emails } }, orderBy: { email: "asc" } });
    expect(JSON.stringify(before) === JSON.stringify(after)).toBe(true);
  });

  it.each([
    { REQUESTER_PASSWORD: "" },
    { REQUESTER_PASSWORD: "short" },
    { REVIEWER_PASSWORD: "x".repeat(73) },
    { REVIEWER_PASSWORD: "\u00e9".repeat(37) },
    { REVIEWER_PASSWORD: requesterPassword },
    { REVIEWER_EMAIL: requesterEmail },
    { REVIEWER_EMAIL: "invalid" },
  ])("rejects invalid inputs before writing users (case %#)", async (overrides) => {
    expect(provision(overrides)).toBe(1);
    expect(await prisma.user.count({ where: { email: { in: emails } } })).toBe(0);
  });
});
