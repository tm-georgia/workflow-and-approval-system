import bcrypt from "bcryptjs";
import { Client } from "pg";

// One-off operations tool. It deliberately does not load .env or accept emails.
// Run only with the migration/schema-owner connection, never the runtime role.
const requesterEmail = "lab5-requester@example.test";
const reviewerEmail = "lab5-reviewer@example.test";
const confirmation = "rotate-existing-lab5-demo-accounts";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const requesterPassword = process.env.REQUESTER_PASSWORD;
  const reviewerPassword = process.env.REVIEWER_PASSWORD;
  const validPassword = (value: string | undefined): value is string =>
    typeof value === "string" && value.length >= 16 && Buffer.byteLength(value, "utf8") <= 72;

  if (!databaseUrl || process.env.ROTATION_CONFIRMATION !== confirmation ||
      !validPassword(requesterPassword) || !validPassword(reviewerPassword) ||
      requesterPassword === reviewerPassword) {
    throw new Error("Invalid rotation configuration.");
  }

  const client = new Client({ connectionString: databaseUrl });
  let connected = false;
  let transaction = false;
  try {
    await client.connect();
    connected = true;
    await client.query("BEGIN");
    transaction = true;
    const { rows } = await client.query<{ id: number; email: string; role: string; passwordHash: string }>(
      'SELECT "id", "email", "role", "passwordHash" FROM public."User" WHERE "email" = ANY($1::text[]) ORDER BY "email" FOR UPDATE',
      [[requesterEmail, reviewerEmail]],
    );
    const requester = rows.find((row) => row.email === requesterEmail && row.role === "REQUESTER");
    const reviewer = rows.find((row) => row.email === reviewerEmail && row.role === "REVIEWER");
    if (rows.length !== 2 || !requester || !reviewer) throw new Error("Unexpected demonstration identities.");

    const current = await Promise.all([
      bcrypt.compare(requesterPassword, requester.passwordHash),
      bcrypt.compare(reviewerPassword, reviewer.passwordHash),
    ]);
    if (current.every(Boolean)) {
      await client.query("COMMIT");
      transaction = false;
      console.log("Both demonstration credentials already match the supplied versions. No records changed.");
      return;
    }
    if (current.some(Boolean)) throw new Error("Both replacement credentials must be fresh.");

    const [requesterHash, reviewerHash] = await Promise.all([
      bcrypt.hash(requesterPassword, 12), bcrypt.hash(reviewerPassword, 12),
    ]);
    const result = await client.query(
      'UPDATE public."User" SET "passwordHash" = CASE "email" WHEN $1 THEN $2 WHEN $3 THEN $4 END WHERE "email" = ANY($5::text[]) RETURNING "id"',
      [requesterEmail, requesterHash, reviewerEmail, reviewerHash, [requesterEmail, reviewerEmail]],
    );
    if (result.rowCount !== 2) throw new Error("Unexpected affected-row count.");
    const verified = await client.query<{ id: number; email: string; role: string; passwordHash: string }>(
      'SELECT "id", "email", "role", "passwordHash" FROM public."User" WHERE "email" = ANY($1::text[]) ORDER BY "email"',
      [[requesterEmail, reviewerEmail]],
    );
    const updatedRequester = verified.rows.find((row) => row.email === requesterEmail);
    const updatedReviewer = verified.rows.find((row) => row.email === reviewerEmail);
    if (verified.rows.length !== 2 || !updatedRequester || !updatedReviewer ||
        updatedRequester.id !== requester.id || updatedRequester.role !== requester.role ||
        updatedReviewer.id !== reviewer.id || updatedReviewer.role !== reviewer.role ||
        updatedRequester.passwordHash === requester.passwordHash || updatedReviewer.passwordHash === reviewer.passwordHash ||
        bcrypt.getRounds(updatedRequester.passwordHash) !== 12 || bcrypt.getRounds(updatedReviewer.passwordHash) !== 12 ||
        !(await bcrypt.compare(requesterPassword, updatedRequester.passwordHash)) ||
        !(await bcrypt.compare(reviewerPassword, updatedReviewer.passwordHash))) {
      throw new Error("Rotation verification failed.");
    }
    await client.query("COMMIT");
    transaction = false;
    console.log("Rotated exactly two existing demonstration credentials. Account identities, roles and requests were preserved.");
  } finally {
    if (transaction) await client.query("ROLLBACK").catch(() => undefined);
    if (connected) await client.end();
  }
}

main().catch(() => {
  // Database/driver errors can contain credentials. Never print the error object.
  console.error("Demo credential rotation failed. Verify configuration, schema-owner access and the two existing account roles. No partial database rotation was committed.");
  process.exitCode = 1;
});
