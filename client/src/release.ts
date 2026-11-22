declare const __WORKFLOW_RELEASE_SHA__: string;

export function releaseSha(value: string | undefined): string {
  if (value === undefined || value === "development") return "development";
  if (!/^[a-f0-9]{40}$/.test(value)) throw new Error("Use a full lowercase Git commit SHA for release metadata.");
  return value;
}

export const RELEASE_SHA = releaseSha(
  typeof __WORKFLOW_RELEASE_SHA__ === "undefined" ? undefined : __WORKFLOW_RELEASE_SHA__,
);
