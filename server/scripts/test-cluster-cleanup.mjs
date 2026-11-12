import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// No service enumeration, port-based shutdown, or arbitrary PID signalling.
// The only stop callback target is the current run's verified data directory.
export async function cleanupOwnedTestCluster(
  { verificationRoot, runDir, dataDir, runId, port, stop, attempts = 50 },
  io = { readFileSync, realpathSync, pause: () => delay(100) },
) {
  const root = io.realpathSync(verificationRoot);
  const ownedRun = io.realpathSync(runDir);
  const ownedData = io.realpathSync(dataDir);
  if (path.dirname(ownedRun) !== root || path.basename(ownedRun) !== runId || ownedData !== path.join(ownedRun, "postgres")) {
    throw new Error("Refusing PostgreSQL cleanup outside this run's owned directory.");
  }
  const marker = JSON.parse(io.readFileSync(path.join(ownedRun, "test-cluster-owner.json"), "utf8"));
  if (marker.runId !== runId || marker.port !== port || path.resolve(marker.dataDir) !== ownedData) {
    throw new Error("Refusing PostgreSQL cleanup: ownership marker mismatch.");
  }
  let incomplete = false;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let lines;
    try { lines = io.readFileSync(path.join(ownedData, "postmaster.pid"), "utf8").trimEnd().split(/\r?\n/); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (lines && lines.length >= 4) {
      const pid = Number(lines[0]);
      if (!Number.isSafeInteger(pid) || pid <= 0 || io.realpathSync(lines[1]) !== ownedData || Number(lines[3]) !== port) {
        throw new Error("Refusing PostgreSQL cleanup: PID metadata does not match this test cluster.");
      }
      await stop(ownedData);
      return true;
    }
    incomplete = Boolean(lines);
    if (attempt + 1 < attempts) await io.pause();
  }
  if (incomplete) throw new Error("Incomplete test-cluster PID metadata; no stop command was sent.");
  return false;
}
