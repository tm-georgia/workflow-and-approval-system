import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Separate from the local demo seed: no default passwords and no updates.
async function main() {
  const required = ["DATABASE_URL", "REQUESTER_EMAIL", "REVIEWER_EMAIL", "REQUESTER_PASSWORD", "REVIEWER_PASSWORD"] as const;
  if (required.some((name) => !process.env[name])) {
    throw new Error("Required account-provisioning configuration is missing.");
  }

  const requesterEmail = process.env.REQUESTER_EMAIL!.trim().toLowerCase();
  const reviewerEmail = process.env.REVIEWER_EMAIL!.trim().toLowerCase();
  const requesterPassword = process.env.REQUESTER_PASSWORD!;
  const reviewerPassword = process.env.REVIEWER_PASSWORD!;
  const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // bcrypt consumes at most 72 bytes; reject passwords it would truncate.
  const validPassword = (password: string) => password.length >= 16 && Buffer.byteLength(password, "utf8") <= 72;
  if (!validEmail(requesterEmail) || !validEmail(reviewerEmail) || requesterEmail === reviewerEmail ||
      !validPassword(requesterPassword) || !validPassword(reviewerPassword) || requesterPassword === reviewerPassword) {
    throw new Error("Use distinct valid emails and distinct passwords of at least 16 characters and at most 72 UTF-8 bytes.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const [requesterHash, reviewerHash] = await Promise.all([
      bcrypt.hash(requesterPassword, 12), bcrypt.hash(reviewerPassword, 12),
    ]);
    // A transaction rolls back both inserts if either email already exists.
    // Do not use upsert, skipDuplicates, or update existing passwords/roles.
    await prisma.$transaction([
      prisma.user.create({ data: { email: requesterEmail, passwordHash: requesterHash, role: "REQUESTER" } }),
      prisma.user.create({ data: { email: reviewerEmail, passwordHash: reviewerHash, role: "REVIEWER" } }),
    ]);
    console.log("Created Requester and Reviewer accounts. Existing accounts were not changed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  // Never log Prisma errors, connection strings, passwords, or hashes.
  console.error("Account provisioning failed. Check configuration, database access, and whether either email already exists. Existing accounts were not changed.");
  process.exitCode = 1;
});
