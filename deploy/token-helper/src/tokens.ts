import { Compute, IdTokenClient } from "google-auth-library";
import { canonicalAudience } from "./config.js";

export interface HeaderClient { getRequestHeaders(): Promise<Headers> }

export function createTokenSource(audienceValue: string, options: { client?: HeaderClient; timeoutMs?: number } = {}) {
  const audience = canonicalAudience(audienceValue);
  // Compute fetches the attached service identity from metadata. No ADC file/key lookup.
  const client = options.client ?? new IdTokenClient({ targetAudience: audience, idTokenProvider: new Compute() });
  let pending: Promise<string> | undefined;
  async function load(): Promise<string> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const headers = await Promise.race([
        client.getRequestHeaders(),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error("Identity timeout.")), options.timeoutMs ?? 3000);
        }),
      ]);
      const authorization = headers.get("authorization") ?? "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
      if (token.length > 12000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
        throw new Error("Invalid identity response.");
      }
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
      if (claims.aud !== audience || !["https://accounts.google.com", "accounts.google.com"].includes(claims.iss) ||
          !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now() + 30_000) {
        throw new Error("Invalid identity claims.");
      }
      // Metadata is the trusted token source; Cloud Run verifies the signature and IAM.
      return token;
    } catch {
      throw new Error("Service identity unavailable.");
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    getToken(): Promise<string> {
      // Reuse the library's expiry-aware cache and coalesce concurrent refreshes.
      if (!pending) pending = load().finally(() => { pending = undefined; });
      return pending;
    },
  };
}
