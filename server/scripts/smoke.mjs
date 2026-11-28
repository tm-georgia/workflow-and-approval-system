import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

if (!process.env.WORKFLOW_TEST_RUN_DIR || !/^postgresql:\/\/(workflow_test|workflow_runtime)@127\.0\.0\.1:\d+\/postgres$/.test(process.env.DATABASE_URL ?? "")) {
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
async function writeRequest(cookie, route, method, body, status) {
  const response = await fetch(base + route, {
    method, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  assert.equal(response.status, status, `${method} ${route}`);
  return response.json();
}
async function readOwn(cookie, id) {
  const response = await fetch(base + "/requests/mine", { headers: { Cookie: cookie } });
  assert.equal(response.status, 200);
  const row = (await response.json()).find(item => item.id === id);
  assert.ok(row);
  return row;
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
  const purchase = await writeRequest(owner, "/requests", "POST", { title: "Workshop", description: "Supplies" }, 201);
  const decisionPath = `/requests/${purchase.id}/decision`;
  const firstReason = "Please include an itemized cost breakdown in the description";
  const lastReason = "Please specify the supplier for each item.";
  await writeRequest(reviewer, decisionPath, "PATCH", { decision: "RETURNED", reason: firstReason }, 200);
  const revised = { title: "Workshop supplies", description: "Ten folders at 20 each, total 200." };
  await writeRequest(owner, `/requests/${purchase.id}/resubmit`, "PATCH", revised, 200);
  await writeRequest(reviewer, decisionPath, "PATCH", { decision: "RETURNED", reason: lastReason }, 200);
  const beforeRestart = await readOwn(owner, purchase.id);
  assert.equal(beforeRestart.status, "RETURNED");
  assert.equal(beforeRestart.title, revised.title);
  assert.equal(beforeRestart.description, revised.description);
  assert.deepEqual(beforeRestart.history.map(({ action, reason, actorId }) => [action, reason, actorId]), [
    ["RETURNED", firstReason, purchase.assignedReviewerId],
    ["RESUBMITTED", null, purchase.requesterId],
    ["RETURNED", lastReason, purchase.assignedReviewerId],
  ]);
  await stop();
  await start();
  const newSession = await login("requester@example.test", "RequesterDemo334!");
  assert.deepEqual(await readOwn(newSession, purchase.id), beforeRestart);
  console.log("PASS F05-T03: corrected request and three ordered events survived a built-server restart and fresh owner login.");
  const retrieved = await fetch(`${base}/requests/mine`, { headers: { Cookie: owner } });
  assert.equal(retrieved.status, 200);
  const persisted = (await retrieved.json()).find((row) => row.id === item.id);
  assert.equal(persisted?.status, "APPROVED");
  assert.equal(persisted?.reviewerId, saved.reviewerId);
  assert.equal(persisted?.decidedAt, saved.decidedAt);
  console.log("PASS: saved decision identity/time and owner retrieval survive a built application restart.");
} finally { await stop(); }
