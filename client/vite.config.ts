import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { releaseSha } from "./src/release.ts";

const release = releaseSha(process.env.RELEASE_SHA);

export default defineConfig({
  plugins: [react(), {
    name: "release-evidence",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ releaseSha: release }) + "\n" });
    },
  }],
  define: { __WORKFLOW_RELEASE_SHA__: JSON.stringify(release) },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
