import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanupOwnedTestCluster } from "./test-cluster-cleanup.mjs";

// Never use DATABASE_URL from the shell/.env for the automated suite.
// A fresh loopback-only cluster contains synthetic records and is retained, stopped.
const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pgBin = process.env.PG_BIN ?? "C:/Program Files/PostgreSQL/18/bin";
const suffix = process.platform === "win32" ? ".exe" : "";
const pgCommand = (name) => path.join(pgBin, name + suffix);
if (!existsSync(pgCommand("initdb"))) {
  console.error("PostgreSQL tools not found. Set PG_BIN to the directory containing initdb and pg_ctl.");
  process.exit(1);
}
const probe = net.createServer();
await new Promise((resolve, reject) => probe.once("error", reject).listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const runId = new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomBytes(4).toString("hex");
const verificationRoot = path.resolve(serverDir, "../.local/verification");
const runDir = path.join(verificationRoot, runId);
const dataDir = path.join(runDir, "postgres");
mkdirSync(runDir, { recursive: true });
writeFileSync(path.join(runDir, "test-cluster-owner.json"), JSON.stringify({ runId, dataDir, port }));
const env = {
  ...process.env,
  DATABASE_URL: `postgresql://workflow_test@127.0.0.1:${port}/postgres`,
  JWT_SECRET: randomBytes(48).toString("hex"),
  DESIGNATED_REVIEWER_EMAIL: "reviewer@example.test",
  NODE_ENV: "test",
  NO_COLOR: "1",
  WORKFLOW_TEST_RUN_DIR: runDir,
};
let startupAttempted = false;
const args = process.argv.slice(2);
const checkStartupTimeout = args.includes("--check-startup-timeout");
const restrictedReview = args.includes("--restricted-review");
function psql(name, role, sql) {
  run(name, pgCommand("psql"), ["-X", "-v", "ON_ERROR_STOP=1", "-h", "127.0.0.1",
    "-p", String(port), "-U", role, "-d", "postgres", "-c", sql]);
}
function run(name, command, args) {
  const log = path.join(runDir, name + ".log");
  const fd = openSync(log, "w");
  let result;
  try {
    // File handles avoid a background postgres process keeping a capture pipe open.
    result = spawnSync(command, args, {
      cwd: serverDir, env, windowsHide: true,
      stdio: ["ignore", fd, fd], timeout: 180_000,
    });
  } finally { closeSync(fd); }
  const output = readFileSync(log, "utf8");
  // No connection strings, JWT values, or environment dumps are printed.
  process.stdout.write(output);
  if (result.error) throw new Error(`${name}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${name} exited with status ${result.status}`);
}
try {
  run("initdb", pgCommand("initdb"), ["-D", dataDir, "-U", "workflow_test", "--auth=trust", "--encoding=UTF8", "--locale=C"]);
  startupAttempted = true;

  try {
    run("start", pgCommand("pg_ctl"), [
      "-D", dataDir,
      "-l", path.join(runDir, "postgres.log"),
      "-o", `-h 127.0.0.1 -p ${port} -c unix_socket_directories=`,
      "-w", "-t", checkStartupTimeout ? "0" : "60",
      "start",
    ]);
  } catch (error) {
    const postgresLog = path.join(runDir, "postgres.log");

    if (existsSync(postgresLog)) {
      console.error("\nPostgreSQL startup log:");
      process.stderr.write(readFileSync(postgresLog, "utf8"));
    }

    throw error;
  }
  if (checkStartupTimeout) throw new Error("Startup-timeout exercise: checking cleanup without running application tests.");
  if (restrictedReview) {
    psql("create-test-roles", "workflow_test", `
      CREATE ROLE workflow_migrator LOGIN;
      CREATE ROLE workflow_runtime LOGIN;
      ALTER SCHEMA public OWNER TO workflow_migrator;
    `);
    env.DATABASE_URL = `postgresql://workflow_migrator@127.0.0.1:${port}/postgres`;
  }
  run("migrations", process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  run("seed", process.execPath, ["--import", "tsx", "prisma/seed.ts"]);
  if (restrictedReview) {
    // Reproduce the deployed Sprint 1 object grants before applying the F-04 delta.
    psql("baseline-grants", "workflow_migrator", `
      GRANT USAGE ON SCHEMA public TO workflow_runtime;
      GRANT SELECT, INSERT ON public."User", public."Request" TO workflow_runtime;
      GRANT UPDATE (status, "reviewerId", "decidedAt") ON public."Request" TO workflow_runtime;
      GRANT USAGE ON SEQUENCE public."User_id_seq", public."Request_id_seq" TO workflow_runtime;
    `);
    const privileges = `SELECT current_user, rolsuper, pg_get_serial_sequence('public."ReviewEvent"', 'id') AS sequence,
      has_table_privilege('public."ReviewEvent"', 'SELECT') AS can_read,
      has_table_privilege('public."ReviewEvent"', 'INSERT') AS can_insert,
      has_table_privilege('public."ReviewEvent"', 'UPDATE') AS can_update,
      has_table_privilege('public."ReviewEvent"', 'DELETE') AS can_delete,
      has_sequence_privilege('public."ReviewEvent_id_seq"', 'USAGE') AS sequence_usage,
      has_sequence_privilege('public."ReviewEvent_id_seq"', 'UPDATE') AS sequence_update
      FROM pg_roles WHERE rolname = current_user`;
    psql("before-event-grants", "workflow_runtime", privileges);
    run("event-grants", process.execPath, ["node_modules/prisma/build/index.js", "db", "execute",
      "--config", "prisma7.config.ts", "--file", "prisma/grants/review-event.sql"]);
    run("resubmit-grants", process.execPath, ["node_modules/prisma/build/index.js", "db", "execute",
      "--config", "prisma7.config.ts", "--file", "prisma/grants/resubmit.sql"]);
    env.DATABASE_URL = `postgresql://workflow_runtime@127.0.0.1:${port}/postgres`;
    psql("after-event-grants", "workflow_runtime", privileges);
    run("restricted-review-tests", process.execPath, ["node_modules/vitest/vitest.mjs", "run",
      "test/reviewer.test.ts", "-t", "F04-REJ-T0[123]|F05-T0[12456]", "--reporter=verbose"]);
    psql("saved-event", "workflow_runtime", 'SELECT current_user, id, "requestId", action, reason FROM public."ReviewEvent" ORDER BY id');
  } else {
    run("tests", process.execPath, ["node_modules/vitest/vitest.mjs", "run", ...args.filter((arg) => arg !== "--smoke")]);
  }
  if (args.includes("--smoke")) run("production-smoke", process.execPath, ["scripts/smoke.mjs"]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (startupAttempted) {
    try {
      const stopped = await cleanupOwnedTestCluster({
        verificationRoot, runDir, dataDir, runId, port,
        stop: (ownedData) => run("stop", pgCommand("pg_ctl"), ["-D", ownedData, "-m", "fast", "-w", "stop"]),
      });
      if (!stopped) console.log("No owned test-cluster PID file appeared; no stop command was sent.");
    }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
  console.log(`Isolated verification logs: ${path.relative(serverDir, runDir)}`);
}
