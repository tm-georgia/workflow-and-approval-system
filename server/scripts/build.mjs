import { build } from "esbuild";

const releaseSha = process.env.RELEASE_SHA ?? "development";
if (releaseSha !== "development" && !/^[a-f0-9]{40}$/.test(releaseSha)) {
  throw new Error("Use a full lowercase Git commit SHA for release metadata.");
}

await build({
  entryPoints: ["src/index.ts"], outfile: "dist/index.js",
  bundle: true, platform: "node", format: "esm", packages: "external",
  target: "node24", sourcemap: true,
  define: { __WORKFLOW_RELEASE_SHA__: JSON.stringify(releaseSha) },
});
console.log("Backend production bundle written to dist/index.js.");
