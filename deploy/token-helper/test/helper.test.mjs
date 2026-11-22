import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { Compute, IdTokenClient } from 'google-auth-library';
import { canonicalAudience, readConfig } from '../dist/config.js';
import { createTokenSource } from '../dist/tokens.js';
import { createHelperServer } from '../dist/server.js';

const audience = 'https://workflow-backend-fixture.asia-southeast1.run.app';
function fixtureToken(claims = {}) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    aud: audience, iss: 'https://accounts.google.com', exp: Math.floor(Date.now() / 1000) + 3600, ...claims,
  })}.${Buffer.from('synthetic-test-signature').toString('base64url')}`;
}
async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}
async function close(server) {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

test('canonical audience accepts the service origin and normalizes one trailing slash', () => {
  assert.equal(canonicalAudience(audience + '/'), audience);
  assert.equal(readConfig({ BACKEND_AUDIENCE: audience }).port, 8081);
});
const invalidAudiences = [undefined, '', 'http://backend.run.app', audience + '/api', audience + '?q=1',
  audience + '#fragment', 'https://example.com', 'https://user:fixture@backend.run.app',
  'https://backend.run.app:443', 'https://BACKEND.run.app', audience + '//'];
invalidAudiences.forEach((value, index) => test(`rejects invalid audience configuration ${index}`, () => {
  assert.throws(() => canonicalAudience(value));
}));
test('rejects metadata overrides and invalid ports without reflecting configuration', () => {
  assert.throws(() => readConfig({ BACKEND_AUDIENCE: audience, GCE_METADATA_HOST: 'untrusted' }));
  for (const port of ['0', '80', '65536', '8081x']) assert.throws(() => readConfig({ BACKEND_AUDIENCE: audience, PORT: port }));
});

test('Google library caches, coalesces concurrent calls, and refreshes an expiring identity', async () => {
  let calls = 0;
  const client = new IdTokenClient({ targetAudience: audience, idTokenProvider: {
    async fetchIdToken(requestedAudience) {
      assert.equal(requestedAudience, audience);
      calls++;
      await new Promise(resolve => setTimeout(resolve, 5));
      return fixtureToken({ sub: `synthetic-${calls}` });
    },
  } });
  const source = createTokenSource(audience, { client });
  const tokens = await Promise.all([source.getToken(), source.getToken(), source.getToken()]);
  assert.equal(calls, 1);
  assert.ok(tokens.every(value => value === tokens[0]));
  await source.getToken();
  assert.equal(calls, 1);
  client.credentials.expiry_date = Date.now();
  const refreshed = await source.getToken();
  assert.equal(calls, 2);
  assert.ok(refreshed !== tokens[0]);
});

test('Compute obtains identity from metadata with the fixed audience, without a JSON key', async () => {
  let calls = 0;
  let metadataFailed = false;
  const metadata = createServer((req, res) => {
    const url = new URL(req.url, 'http://metadata');
    assert.equal(url.pathname, '/computeMetadata/v1/instance/service-accounts/default/identity');
    assert.equal(url.searchParams.get('audience'), audience);
    assert.equal(req.headers['metadata-flavor'], 'Google');
    assert.ok(!req.headers.cookie && !req.headers.authorization);
    calls++;
    if (metadataFailed) { res.writeHead(403, { 'Metadata-Flavor': 'Google' }).end('synthetic metadata error detail'); return; }
    res.writeHead(200, { 'Metadata-Flavor': 'Google', 'Content-Type': 'text/plain' }).end(fixtureToken());
  });
  const base = await listen(metadata);
  const previousHost = process.env.GCE_METADATA_HOST;
  const previousKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  try {
    // Test-only injection. The deployed entrypoint explicitly rejects this override.
    process.env.GCE_METADATA_HOST = base.slice('http://'.length);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/nonexistent-key-must-not-be-opened.json';
    const client = new IdTokenClient({ targetAudience: audience, idTokenProvider: new Compute() });
    const source = createTokenSource(audience, { client });
    await source.getToken();
    assert.equal(calls, 1);
    client.credentials.expiry_date = Date.now();
    metadataFailed = true;
    await assert.rejects(source.getToken(), { message: 'Service identity unavailable.' });
    metadataFailed = false;
    await source.getToken();
    assert.ok(calls >= 3);
  } finally {
    if (previousHost === undefined) delete process.env.GCE_METADATA_HOST; else process.env.GCE_METADATA_HOST = previousHost;
    if (previousKey === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS; else process.env.GOOGLE_APPLICATION_CREDENTIALS = previousKey;
    await close(metadata);
  }
});

test('rejects metadata failure, timeout, wrong audience, wrong issuer and expired tokens', async () => {
  const responses = [
    async () => { throw new Error('synthetic upstream detail must not escape'); },
    async () => new Promise(() => {}),
    async () => new Headers({ authorization: 'Bearer ' + fixtureToken({ aud: 'https://wrong.run.app' }) }),
    async () => new Headers({ authorization: 'Bearer ' + fixtureToken({ iss: 'untrusted' }) }),
    async () => new Headers({ authorization: 'Bearer ' + fixtureToken({ exp: 1 }) }),
    async () => new Headers({ authorization: 'Bearer malformed' }),
    async () => new Headers(),
  ];
  for (const getRequestHeaders of responses) {
    const source = createTokenSource(audience, { client: { getRequestHeaders }, timeoutMs: 10 });
    await assert.rejects(source.getToken(), { message: 'Service identity unavailable.' });
  }
});

test('helper health never contains identity; routes and browser-input isolation are enforced', async () => {
  let calls = 0;
  const token = fixtureToken();
  const server = createHelperServer({ async getToken() { calls++; return token; } });
  const base = await listen(server);
  try {
    const health = await fetch(base + '/health');
    assert.equal(health.status, 204);
    assert.ok(health.headers.get('x-backend-id-token') === null);
    const identity = await fetch(base + '/token');
    assert.equal(identity.status, 204);
    assert.equal(identity.headers.get('cache-control'), 'no-store');
    assert.ok(identity.headers.get('x-backend-id-token') === token);
    assert.equal(await identity.text(), '');
    for (const headers of [{ Cookie: 'synthetic=fixture' }, { Authorization: 'synthetic-user-header' },
      { 'X-Serverless-Authorization': 'synthetic-spoof' }, { 'X-Backend-ID-Token': 'synthetic-spoof' }, { 'Content-Length': '1' }]) {
      // Native HTTP permits a deliberate GET body for this negative check.
      const { request } = await import('node:http');
      const status = await new Promise((resolve, reject) => {
        const req = request(base + '/token', { headers }, response => { response.resume(); resolve(response.statusCode); });
        req.on('error', reject);
        req.end(headers['Content-Length'] ? 'x' : undefined);
      });
      assert.equal(status, 400);
    }
    assert.equal(calls, 2);
    for (const path of ['/token?audience=untrusted', '/anything', '/_backend_identity']) {
      assert.equal((await fetch(base + path)).status, 404);
    }
    assert.equal((await fetch(base + '/token', { method: 'POST', body: 'synthetic-body' })).status, 404);
  } finally { await close(server); }
});

test('helper returns an empty sanitized failure without identity headers', async () => {
  const server = createHelperServer({ async getToken() { throw new Error('synthetic secret detail'); } });
  const base = await listen(server);
  try {
    const response = await fetch(base + '/token');
    assert.equal(response.status, 503);
    assert.equal(await response.text(), '');
    assert.ok(response.headers.get('x-backend-id-token') === null);
  } finally { await close(server); }
});
