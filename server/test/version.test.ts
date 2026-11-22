import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createVersionRouter, releaseSha } from "../src/version";

function app() {
  return express().use("/api/version", createVersionRouter());
}

describe("running version evidence", () => {
  it("returns non-secret, non-cacheable metadata without database or login access", async () => {
    const process = app();
    const first = await request(process).get("/api/version").expect(200);
    const second = await request(process).get("/api/version").expect(200);
    expect(first.headers["cache-control"]).toBe("no-store");
    expect(Object.keys(first.body).sort()).toEqual(["instanceId", "releaseSha"]);
    expect(first.body.releaseSha).toBe("development");
    expect(first.body.instanceId).toMatch(/^[a-f0-9-]{36}$/);
    expect(second.body).toEqual(first.body);
    const restarted = await request(app()).get("/api/version").expect(200);
    expect(restarted.body.instanceId).not.toBe(first.body.instanceId);
  });

  it("rejects malformed release metadata before it can be returned", () => {
    expect(releaseSha("a".repeat(40))).toBe("a".repeat(40));
    expect(releaseSha(undefined)).toBe("development");
    for (const value of ["", "abc123", "A".repeat(40), "release\nvalue", "<script>"]) {
      expect(() => releaseSha(value)).toThrow("Use a full lowercase Git commit SHA");
    }
  });
});
