import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

if (!process.env.WORKFLOW_TEST_RUN_DIR || !process.env.DATABASE_URL?.startsWith("postgresql://workflow_test@127.0.0.1:")) {
  throw new Error("Run this smoke check only through the isolated test harness.");
}
const probe = net.createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const base = `http://127.0.0.1:${port}/api`;
let child;
let logFd;
async function start() {
  logFd = openSync(path.join(process.env.WORKFLOW_TEST_RUN_DIR, "http-server.log"), "a");
  child = spawn(process.execPath, ["dist/index.js"], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    windowsHide: true, stdio: ["ignore", logFd, logFd],
  });
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error("Built server exited before readiness; inspect http-server.log.");
    try { if ((await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) })).ok) return; } catch { /* wait for ready */ }
    await delay(100);
  }
  throw new Error("Built server did not become ready.");
}
async function stop() {
  if (child && child.exitCode === null) {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await exited;
  }
  if (logFd !== undefined) { closeSync(logFd); logFd = undefined; }
}
async function login(email, password) {
  const result = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  assert.equal(result.status, 200, "Smoke login must succeed.");
  const cookie = result.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "Authentication cookie is required.");
  return cookie;
}
try {
  await start();
  const owner = await login("requester@example.test", "RequesterDemo334!");
  const submitted = await fetch(`${base}/requests`, { method: "POST", headers: { Cookie: owner, "Content-Type": "application/json" }, body: JSON.stringify({ title: "[SMOKE] persisted decision", description: "Synthetic production-bundle journey" }) });
  assert.equal(submitted.status, 201);
  const item = await submitted.json();
  const reviewer = await login("reviewer@example.test", "ReviewerDemo334!");
  const pending = await fetch(`${base}/requests/pending`, { headers: { Cookie: reviewer } });
  assert.equal(pending.status, 200);
  assert.ok((await pending.json()).some((row) => row.id === item.id));
  const forbidden = await fetch(`${base}/requests/${item.id}/decision`, { method: "PATCH", headers: { Cookie: owner, "Content-Type": "application/json" }, body: JSON.stringify({ decision: "APPROVED" }) });
  assert.equal(forbidden.status, 403);
  const decided = await fetch(`${base}/requests/${item.id}/decision`, { method: "PATCH", headers: { Cookie: reviewer, "Content-Type": "application/json" }, body: JSON.stringify({ decision: "APPROVED" }) });
  assert.equal(decided.status, 200);
  const saved = await decided.json();
  const repeated = await fetch(`${base}/requests/${item.id}/decision`, { method: "PATCH", headers: { Cookie: reviewer, "Content-Type": "application/json" }, body: JSON.stringify({ decision: "REJECTED" }) });
  assert.equal(repeated.status, 409);
  console.log("PASS: built HTTP server login -> submission -> assigned list -> forbidden Requester decision -> approval -> repeated-decision refusal.");
  await stop();
  await start();
  const retrieved = await fetch(`${base}/requests/mine`, { headers: { Cookie: owner } });
  assert.equal(retrieved.status, 200);
  const persisted = (await retrieved.json()).find((row) => row.id === item.id);
  assert.equal(persisted?.status, "APPROVED");
  assert.equal(persisted?.reviewerId, saved.reviewerId);
  assert.equal(persisted?.decidedAt, saved.decidedAt);
  console.log("PASS: saved decision identity/time and owner retrieval survive a built application restart.");
} finally { await stop(); }
