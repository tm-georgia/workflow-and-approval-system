import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import { renderService } from '../../render-cloudrun.mjs';

const registry = 'asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/';
const image = name => `${registry}${name}@sha256:${'a'.repeat(64)}`;
const backendUrl = 'https://workflow-backend-fixture.asia-southeast1.run.app';
const frontend = { 'nginx-image': image('frontend'), 'helper-image': image('token-helper'), 'backend-url': backendUrl,
  'service-account': 'workflow-frontend@cpe334-workflow-approval-2026.iam.gserviceaccount.com' };
const backend = { 'backend-image': image('backend'), 'service-account': 'workflow-backend@cpe334-workflow-approval-2026.iam.gserviceaccount.com',
  'reviewer-email': 'reviewer@example.test', 'runtime-db-version': '1', 'jwt-version': '2' };

test('frontend exposes only Nginx, requires Google authentication and orders the sidecar first', () => {
  const service = parse(renderService('frontend', frontend));
  const [nginx, helper] = service.spec.template.spec.containers;
  assert.deepEqual(nginx.ports, [{ containerPort: 80 }]);
  assert.equal(helper.ports, undefined);
  assert.equal(nginx.env.find(value => value.name === 'BACKEND_AUTH_MODE').value, 'google');
  assert.equal(helper.env.find(value => value.name === 'BACKEND_AUDIENCE').value, backendUrl);
  assert.deepEqual(JSON.parse(service.spec.template.metadata.annotations['run.googleapis.com/container-dependencies']), { nginx: ['token-helper'] });
  assert.equal(helper.startupProbe.httpGet.port, 8081);
  assert.ok(!JSON.stringify(service).includes('secretKeyRef'));
});
test('backend keeps the IAM check enabled and uses pinned secret references', () => {
  const service = parse(renderService('backend', backend));
  assert.equal(service.metadata.annotations['run.googleapis.com/invoker-iam-disabled'], 'false');
  const container = service.spec.template.spec.containers[0];
  assert.equal(container.ports[0].containerPort, 8080);
  assert.equal(container.env.find(value => value.name === 'DATABASE_URL').valueFrom.secretKeyRef.key, '1');
  assert.equal(container.env.find(value => value.name === 'JWT_SECRET').valueFrom.secretKeyRef.key, '2');
  assert.ok(!JSON.stringify(service).includes('allUsers'));
});
test('renderer rejects unpinned images/versions, wrong identity and bad audience', () => {
  for (const overrides of [{ 'nginx-image': registry + 'frontend:latest' }, { 'backend-url': backendUrl + '/api' },
    { 'service-account': backend['service-account'] }]) assert.throws(() => renderService('frontend', { ...frontend, ...overrides }));
  assert.throws(() => renderService('backend', { ...backend, 'jwt-version': 'latest' }));
  assert.throws(() => renderService('backend', { ...backend, 'reviewer-email': 'bad\nfield' }));
});
test('Nginx auth configuration isolates the helper and strips credentials in local mode', () => {
  const config = readFileSync(new URL('../../../client/nginx.conf', import.meta.url), 'utf8');
  const google = readFileSync(new URL('../../../client/nginx-auth/google.conf', import.meta.url), 'utf8');
  const local = readFileSync(new URL('../../../client/nginx-auth/none.conf', import.meta.url), 'utf8');
  assert.match(config, /location = \/_backend_identity\s*\{\s*internal;/);
  assert.match(config, /proxy_pass_request_headers off;/);
  assert.match(config, /proxy_pass_request_body off;/);
  assert.match(config, /proxy_ssl_verify on;/);
  assert.match(google, /auth_request \/_backend_identity;/);
  assert.match(local, /X-Serverless-Authorization "";/);
});
