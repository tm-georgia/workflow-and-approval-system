import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { cleanupOwnedTestCluster } from "../scripts/test-cluster-cleanup.mjs";

function fixture() {
  const verificationRoot = path.resolve("synthetic-verification-root");
  const runId = "current-synthetic-run";
  const runDir = path.join(verificationRoot, runId);
  const dataDir = path.join(runDir, "postgres");
  const port = 55434;
  const marker = { runId, dataDir, port };
  const record = ["12345", dataDir, "1700000000", String(port), "", "", "", "ready"].join("\n");
  const stop = vi.fn();
  const io = {
    realpathSync: (value) => path.resolve(value),
    readFileSync: vi.fn((file) => file.endsWith("test-cluster-owner.json") ? JSON.stringify(marker) : record),
    pause: vi.fn(async () => {}),
  };
  return { options: { verificationRoot, runDir, dataDir, runId, port, stop, attempts: 2 }, io, marker, record, stop };
}

describe("Owned PostgreSQL test-cluster cleanup", () => {
  it.each(["failed", "timed-out"])("TEST-CLEANUP-01: stops the owned cluster after a %s startup command", async () => {
    const { options, io, stop } = fixture();
    let started = false;
    try { throw new Error("Startup did not report success"); }
    catch { expect(started).toBe(false); }
    finally { expect(await cleanupOwnedTestCluster(options, io)).toBe(true); }
    expect(stop).toHaveBeenCalledExactlyOnceWith(options.dataDir);
  });

  it("TEST-CLEANUP-02: absent PID metadata never causes an unrelated stop", async () => {
    const { options, io, stop } = fixture();
    const read = io.readFileSync.getMockImplementation();
    io.readFileSync.mockImplementation((file) => {
      if (file.endsWith("postmaster.pid")) throw Object.assign(new Error("Not started"), { code: "ENOENT" });
      return read(file);
    });
    expect(await cleanupOwnedTestCluster(options, io)).toBe(false);
    expect(stop).not.toHaveBeenCalled();
  });

  it("TEST-CLEANUP-03: waits for a startup PID record to finish before stopping", async () => {
    const { options, io, record, stop } = fixture();
    let reads = 0;
    const read = io.readFileSync.getMockImplementation();
    io.readFileSync.mockImplementation((file) => file.endsWith("postmaster.pid") && ++reads === 1 ? "12345\n" : read(file));
    expect(await cleanupOwnedTestCluster(options, io)).toBe(true);
    expect(record).toContain(options.dataDir);
    expect(io.pause).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledExactlyOnceWith(options.dataDir);
  });

  it.each(["directory", "port", "pid"])("TEST-CLEANUP-04: refuses mismatched %s metadata", async (field) => {
    const { options, io, record, stop } = fixture();
    const lines = record.split("\n");
    if (field === "directory") lines[1] = path.resolve("unrelated-postgres");
    if (field === "port") lines[3] = "5432";
    if (field === "pid") lines[0] = "-1";
    const read = io.readFileSync.getMockImplementation();
    io.readFileSync.mockImplementation((file) => file.endsWith("postmaster.pid") ? lines.join("\n") : read(file));
    await expect(cleanupOwnedTestCluster(options, io)).rejects.toThrow("PID metadata does not match");
    expect(stop).not.toHaveBeenCalled();
  });

  it("TEST-CLEANUP-05: rejects an escaped/symlinked data directory", async () => {
    const { options, io, stop } = fixture();
    io.realpathSync = (value) => value === options.dataDir ? path.resolve("unrelated-postgres") : path.resolve(value);
    await expect(cleanupOwnedTestCluster(options, io)).rejects.toThrow("outside this run's owned directory");
    expect(stop).not.toHaveBeenCalled();
  });

  it("TEST-CLEANUP-06: refuses another run's ownership marker", async () => {
    const { options, io, marker, stop } = fixture();
    marker.runId = "another-run";
    await expect(cleanupOwnedTestCluster(options, io)).rejects.toThrow("ownership marker mismatch");
    expect(stop).not.toHaveBeenCalled();
  });

  it("TEST-CLEANUP-07: discloses incomplete PID metadata without guessing a target", async () => {
    const { options, io, stop } = fixture();
    const read = io.readFileSync.getMockImplementation();
    io.readFileSync.mockImplementation((file) => file.endsWith("postmaster.pid") ? "12345\n" : read(file));
    await expect(cleanupOwnedTestCluster(options, io)).rejects.toThrow("Incomplete test-cluster PID metadata");
    expect(stop).not.toHaveBeenCalled();
  });
});
