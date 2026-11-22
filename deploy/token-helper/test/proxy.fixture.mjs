// Loaded only by the isolated Docker integration test; excluded from helper images.
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { IdTokenClient } from 'google-auth-library';
import { createHelperServer } from '/app/dist/server.js';
import { createTokenSource } from '/app/dist/tokens.js';

const audience = 'https://backend.fixture.run.app';
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const identity = `${encode({ alg: 'RS256' })}.${encode({ aud: audience, iss: 'https://accounts.google.com',
  exp: Math.floor(Date.now() / 1000) + 3600 })}.${randomBytes(32).toString('base64url')}`;
let failed = false;
const state = { helperRequests: 0, helperClean: true, backendRequests: 0 };
const client = new IdTokenClient({ targetAudience: audience, idTokenProvider: {
  async fetchIdToken() { return identity; },
} });
const source = createTokenSource(audience, { client });
const helper = createHelperServer({ async getToken() {
  if (failed) throw new Error('synthetic metadata failure');
  return source.getToken();
} });
helper.on('request', req => {
  state.helperRequests++;
  state.helperClean &&= req.url === '/token' && req.method === 'GET' &&
    !req.headers.cookie && !req.headers.authorization && !req.headers['x-serverless-authorization'] &&
    !req.headers['x-backend-id-token'] && !req.headers['content-length'] && !req.headers['transfer-encoding'];
});
helper.listen(8081, '0.0.0.0');

function backend(req, res) {
  state.backendRequests++;
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const identityMatches = req.headers['x-serverless-authorization'] === `Bearer ${identity}`;
    if (req.socket.encrypted && !identityMatches) { res.writeHead(403).end(); return; }
    // Deliberately try reflecting identity headers: Nginx must hide them.
    res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'app-session=synthetic; Path=/; Secure; HttpOnly; SameSite=Lax',
      'X-Backend-ID-Token': identity, 'X-Serverless-Authorization': `Bearer ${identity}` });
    res.end(JSON.stringify({ url: req.url, method: req.method, body, host: req.headers.host,
      sni: req.socket.servername, proto: req.headers['x-forwarded-proto'],
      identityMatches, identityAbsent: !req.headers['x-serverless-authorization'],
      browserCookiePreserved: req.headers.cookie === 'browser-session=synthetic',
      userAuthorizationPreserved: req.headers.authorization === 'synthetic-user-authorization',
      customIdentityAbsent: !req.headers['x-backend-id-token'] }));
  });
}
http.createServer(backend).listen(3000, '0.0.0.0');
https.createServer({ key: fs.readFileSync('/fixtures/key.pem'), cert: fs.readFileSync('/fixtures/cert.pem') }, backend).listen(443, '0.0.0.0');
http.createServer((req, res) => {
  if (req.url === '/fail') failed = true;
  if (req.url === '/recover') failed = false;
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(state));
}).listen(9090, '0.0.0.0');
