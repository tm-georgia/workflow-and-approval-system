import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const demoUsers = [
  {
    email: "requester@example.test",
    password: "RequesterDemo334!",
    role: "REQUESTER" as const,
  },
  {
    email: "reviewer@example.test",
    password: "ReviewerDemo334!",
    role: "REVIEWER" as const,
  },
];

async function main() {
  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, role: user.role },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }

  console.log("Seeded the Requester and Reviewer demo accounts.");
}

main()
  .catch((error) => {
    console.error("Seeding failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });