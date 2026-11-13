import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"], outfile: "dist/index.js",
  bundle: true, platform: "node", format: "esm", packages: "external",
  target: "node24", sourcemap: true,
});
console.log("Backend production bundle written to dist/index.js.");
