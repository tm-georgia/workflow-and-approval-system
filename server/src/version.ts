import { randomUUID } from "node:crypto";
import { Router } from "express";

declare const __WORKFLOW_RELEASE_SHA__: string;

export function releaseSha(value: string | undefined): string {
  if (value === undefined || value === "development") return "development";
  if (!/^[a-f0-9]{40}$/.test(value)) throw new Error("Use a full lowercase Git commit SHA for release metadata.");
  return value;
}

const compiledRelease = releaseSha(
  typeof __WORKFLOW_RELEASE_SHA__ === "undefined" ? undefined : __WORKFLOW_RELEASE_SHA__,
);

// Process-scoped, opaque and unrelated to credentials or application records.
// A changed value supports restart evidence; it is not a Cloud Run restart API.
export function createVersionRouter() {
  const router = Router();
  const instanceId = randomUUID();
  router.get("/", (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.json({ releaseSha: compiledRelease, instanceId });
  });
  return router;
}
