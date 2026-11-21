import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import selfsigned from 'selfsigned';

const prefix = 'lab5-private-' + randomUUID().slice(0, 10);
const frontendImage = process.env.FRONTEND_TEST_IMAGE ?? 'workflow-client:lab5-private';
const helperImage = process.env.HELPER_TEST_IMAGE ?? 'workflow-token-helper:lab5-private';
const temp = mkdtempSync(path.join(tmpdir(), 'lab5-private-'));
const fixture = prefix + '-fixture';
const frontend = prefix + '-nginx';
let networkCreated = false;
const jwtPattern = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
function docker(...args) {
  const result = spawnSync('docker', args, { encoding: 'utf8', timeout: 90_000, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error('Docker fixture operation failed: ' +
    (result.stderr ?? '').replace(new RegExp(jwtPattern, 'g'), '[redacted]').slice(-1600));
  return result.stdout;
}
function remove(name) { spawnSync('docker', ['rm', '--force', name], { stdio: 'ignore', windowsHide: true, timeout: 20_000 }); }
function assertSafeLogs(name) {
  const result = spawnSync('docker', ['logs', name], { encoding: 'utf8', windowsHide: true, timeout: 20_000 });
  assert.ok(result.status === 0 && !jwtPattern.test(result.stdout + result.stderr), 'Identity must not appear in either log stream.');
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function startFrontend(env = {}, trusted = true) {
  const args = ['run', '--detach', '--name', frontend, '--network', `container:${fixture}`];
  for (const [name, value] of Object.entries(env)) args.push('--env', `${name}=${value}`);
  if (trusted) args.push('--volume', `${path.join(temp, 'cert.pem')}:/etc/ssl/certs/ca-certificates.crt:ro`);
  docker(...args, frontendImage);
  const base = 'http://' + docker('port', fixture, '80/tcp').trim();
  for (let index = 0; index < 50; index++) {
    try { if ((await fetch(base, { signal: AbortSignal.timeout(1000) })).status === 200) return base; } catch {}
    await pause(100);
  }
  throw new Error('Nginx fixture failed startup.');
}
async function checkedFetch(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });
  const body = await response.text();
  assert.ok(!jwtPattern.test(body), 'Identity must not appear in a browser response body.');
  assert.ok([...response.headers.values()].every(value => !jwtPattern.test(value)), 'Identity must not appear in browser response headers.');
  assert.ok(response.headers.get('x-backend-id-token') === null);
  assert.ok(response.headers.get('x-serverless-authorization') === null);
  return { response, body };
}
try {
  const certificate = await selfsigned.generate([{ name: 'commonName', value: 'backend.fixture.run.app' }], {
    algorithm: 'sha256', keySize: 2048,
    notBeforeDate: new Date(Date.now() - 60_000), notAfterDate: new Date(Date.now() + 86_400_000),
    extensions: [{ name: 'basicConstraints', cA: true },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, keyCertSign: true },
      { name: 'extKeyUsage', serverAuth: true },
      { name: 'subjectAltName', altNames: [{ type: 2, value: 'backend.fixture.run.app' }] }],
  });
  writeFileSync(path.join(temp, 'cert.pem'), certificate.cert);
  writeFileSync(path.join(temp, 'key.pem'), certificate.private, { mode: 0o600 });
  writeFileSync(path.join(temp, 'fixture.mjs'), readFileSync(new URL('./proxy.fixture.mjs', import.meta.url)));
  docker('network', 'create', prefix);
  networkCreated = true;
  // The fixture shares a network namespace with Nginx, just like Cloud Run sidecars.
  docker('run', '--detach', '--name', fixture, '--user', '0', '--network', prefix,
    '--network-alias', 'server', '--network-alias', 'backend.fixture.run.app', '--network-alias', 'wrong.fixture.run.app',
    '--publish', '127.0.0.1::80', '--publish', '127.0.0.1::9090',
    '--volume', `${temp}:/fixtures:ro`, '--volume', `${path.join(temp, 'fixture.mjs')}:/app/fixture.mjs:ro`,
    helperImage, 'node', '/app/fixture.mjs');
  const control = 'http://' + docker('port', fixture, '9090/tcp').trim();
  for (let index = 0; index < 50; index++) {
    try { if ((await fetch(control)).ok) break; } catch {}
    await pause(100);
  }
  const googleEnv = { BACKEND_URL: 'https://backend.fixture.run.app', BACKEND_AUTH_MODE: 'google', K_SERVICE: 'workflow-frontend' };
  let base = await startFrontend(googleEnv);
  const requestPath = '/api/items/a%2Fb?filter=a%2Fb&sort=asc';
  const browserHeaders = { Cookie: 'browser-session=synthetic', Authorization: 'synthetic-user-authorization',
    'X-Serverless-Authorization': 'synthetic-spoof', 'X-Backend-ID-Token': 'synthetic-spoof',
    'X-Forwarded-Proto': 'https', 'Content-Type': 'application/json' };
  const result = await checkedFetch(base + requestPath, { method: 'POST', headers: browserHeaders, body: '{"synthetic":true}' });
  assert.equal(result.response.status, 200);
  const received = JSON.parse(result.body);
  assert.equal(received.url, requestPath);
  assert.equal(received.body, '{"synthetic":true}');
  assert.equal(received.host, 'backend.fixture.run.app');
  assert.equal(received.sni, 'backend.fixture.run.app');
  assert.equal(received.proto, 'https');
  assert.ok(received.identityMatches && received.customIdentityAbsent && received.browserCookiePreserved && received.userAuthorizationPreserved);
  assert.ok(['Secure', 'HttpOnly', 'SameSite=Lax'].every(flag => result.response.headers.get('set-cookie').includes(flag)));
  assert.ok((await (await fetch(control)).json()).helperClean);
  assert.equal((await checkedFetch(base + '/_backend_identity')).response.status, 404);
  assert.equal((await checkedFetch(base + '/_backend_identity?audience=untrusted')).response.status, 404);
  assert.equal((await checkedFetch(base + '/requests/42')).response.status, 200);
  console.log('PASS: identity injection/spoof replacement, internal endpoint isolation, header/body isolation, paths/query/body/cookies, Host/SNI/TLS and SPA fallback');
  const beforeFailure = await (await fetch(control + '/fail')).json();
  const failure = await checkedFetch(base + '/api/health', { headers: browserHeaders });
  assert.equal(failure.response.status, 503);
  const afterFailure = await (await fetch(control)).json();
  assert.equal(afterFailure.backendRequests, beforeFailure.backendRequests);
  await fetch(control + '/recover');
  assert.equal((await checkedFetch(base + '/api/health')).response.status, 200);
  assertSafeLogs(frontend);
  assertSafeLogs(fixture);
  console.log('PASS: token failure is closed (no backend request), recovery succeeds, identity absent from browser responses and access logs');
  remove(frontend);
  base = await startFrontend({});
  const local = JSON.parse((await checkedFetch(base + requestPath, { headers: browserHeaders })).body);
  assert.ok(local.identityAbsent && local.browserCookiePreserved);
  assert.equal(local.host, 'server:3000');
  remove(frontend);
  console.log('PASS: absent auth mode retains Compose upstream and strips spoofed service identity');
  base = await startFrontend(googleEnv, false);
  assert.equal((await checkedFetch(base + '/api/health')).response.status, 502);
  remove(frontend);
  base = await startFrontend({ ...googleEnv, BACKEND_URL: 'https://wrong.fixture.run.app' });
  assert.equal((await checkedFetch(base + '/api/health')).response.status, 502);
  remove(frontend);
  console.log('PASS: untrusted TLS certificates and hostname mismatch are rejected');
  const invalidConfigs = [ { K_SERVICE: 'workflow-frontend' }, { BACKEND_AUTH_MODE: 'invalid' },
    { BACKEND_AUTH_MODE: 'google' }, { ...googleEnv, BACKEND_URL: 'https://backend.fixture.run.app/api' },
    { ...googleEnv, BACKEND_URL: 'https://example.com' }, { ...googleEnv, BACKEND_URL: 'https://backend.fixture.run.app:443' } ];
  for (const env of invalidConfigs) {
    const args = ['run', '--rm', '--network', `container:${fixture}`];
    for (const [name, value] of Object.entries(env)) args.push('--env', `${name}=${value}`);
    const rejected = spawnSync('docker', [...args, frontendImage, 'nginx', '-t'], { encoding: 'utf8', windowsHide: true, timeout: 20_000 });
    assert.ok(rejected.status !== 0);
  }
  console.log('PASS: invalid authentication configurations and missing Cloud Run authentication mode fail startup');
} finally {
  remove(frontend);
  remove(fixture);
  if (networkCreated) spawnSync('docker', ['network', 'rm', prefix], { stdio: 'ignore', windowsHide: true, timeout: 20_000 });
  if (path.dirname(path.resolve(temp)) !== path.resolve(tmpdir()) || !path.basename(temp).startsWith('lab5-private-')) {
    throw new Error('Refusing unexpected temporary cleanup path.');
  }
  rmSync(temp, { recursive: true, force: true });
  console.log('Removed isolated proxy fixtures, network, and generated certificate files.');
}
