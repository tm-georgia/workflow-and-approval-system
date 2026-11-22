import { createServer } from "node:http";

export function createHelperServer(source: { getToken(): Promise<string> }) {
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    const known = request.url === "/token" || request.url === "/health";
    if (!known || request.method !== "GET") {
      response.writeHead(404).end();
      return;
    }
    // The Nginx subrequest must contain no browser credentials or request payload.
    if (request.headers.cookie || request.headers.authorization || request.headers["x-serverless-authorization"] ||
        request.headers["x-backend-id-token"] || request.headers["transfer-encoding"] ||
        (request.headers["content-length"] && request.headers["content-length"] !== "0")) {
      response.writeHead(400).end();
      request.resume();
      return;
    }
    try {
      const token = await source.getToken();
      if (request.url === "/token") response.setHeader("X-Backend-ID-Token", token);
      response.writeHead(204).end();
    } catch {
      // No provider errors, headers, payloads, or tokens in responses/logs.
      response.writeHead(503).end();
    }
  });
  server.maxHeadersCount = 32;
  server.headersTimeout = 5000;
  server.requestTimeout = 5000;
  return server;
}
