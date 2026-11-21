import { readConfig } from "./config.js";
import { createTokenSource } from "./tokens.js";
import { createHelperServer } from "./server.js";

try {
  const { audience, port } = readConfig(process.env);
  const server = createHelperServer(createTokenSource(audience));
  server.on("error", () => { console.error("Token helper could not start."); process.exitCode = 1; });
  server.listen(port, "0.0.0.0");
  process.on("SIGTERM", () => { server.close(); server.closeIdleConnections(); });
} catch {
  console.error("Token helper configuration is invalid.");
  process.exitCode = 1;
}
