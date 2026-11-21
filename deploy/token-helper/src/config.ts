export function canonicalAudience(value: string | undefined): string {
  if (!value) throw new Error("BACKEND_AUDIENCE is required.");
  const canonical = value.endsWith("/") ? value.slice(0, -1) : value;
  const url = new URL(canonical);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".run.app") ||
      url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash ||
      url.origin !== canonical) {
    throw new Error("Use the canonical HTTPS Cloud Run service origin as BACKEND_AUDIENCE.");
  }
  return canonical;
}

export function readConfig(env: NodeJS.ProcessEnv) {
  // Prevent metadata redirection; this service never discovers JSON key files.
  if (env.GCE_METADATA_HOST || env.GCE_METADATA_IP) throw new Error("Metadata overrides are not supported.");
  const audience = canonicalAudience(env.BACKEND_AUDIENCE);
  const port = Number(env.PORT ?? 8081);
  if (!/^\d+$/.test(env.PORT ?? "8081") || !Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("Invalid helper port.");
  }
  return { audience, port };
}
