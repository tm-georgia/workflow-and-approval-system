import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from '../token-helper/node_modules/yaml/dist/index.js';
import { releaseContext, targets, verifiedImages, manifest, checkInvoker, serviceSnapshot, readyRevision,
  assertCurrentMain, assertServiceConfiguration, guardedReplacement, smoke, settings } from '../release.mjs';

const sha = 'a'.repeat(40);
const env = { GITHUB_REPOSITORY: 'tm-georgia/workflow-and-approval-system', GITHUB_REF: 'refs/heads/main',
  GITHUB_EVENT_NAME: 'push', GITHUB_SHA: sha, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1',
  RUNTIME_DB_VERSION: '1', JWT_VERSION: '1' };
const context = releaseContext(env);
const images = Object.fromEntries(targets.map(({ name }) => [name, settings.registry + '/' + name + '@sha256:' + 'b'.repeat(64)]));
test('only full-SHA main push/manual releases with pinned secret versions are accepted', () => {
  assert.equal(context.tag, sha + '-123-1');
  assert.doesNotThrow(() => releaseContext({ ...env, GITHUB_EVENT_NAME: 'workflow_dispatch' }));
  for (const patch of [{ GITHUB_REF: 'refs/heads/sprint-staging' }, { GITHUB_REPOSITORY: 'attacker/repo' },
    { GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_SHA: 'development' }, { GITHUB_RUN_ID: '../oops' },
    { RUNTIME_DB_VERSION: 'latest' }, { JWT_VERSION: '1\nextra' }]) {
    assert.throws(() => releaseContext({ ...env, ...patch }));
  }
});
test('only four reviewed targets, immutable registry paths and matching run provenance are allowed', () => {
  assert.deepEqual(targets.map(({ name, target }) => [name, target]),
    [['operations', 'operations'], ['backend', 'production'], ['frontend', 'production'], ['token-helper', 'production']]);
  assert.deepEqual(verifiedImages({ ...context, images }, context), images);
  for (const record of [{ ...context, sha: 'c'.repeat(40), images },
    { ...context, images: { ...images, backend: settings.registry + '/backend:latest' } },
    { ...context, images: { ...images, frontend: 'other.example/frontend@sha256:' + 'b'.repeat(64) } }]) {
    assert.throws(() => verifiedImages(record, context));
  }
});
test('release manifests retain the private backend, public ingress sidecar boundary, SQL and numeric secret references', () => {
  const backend = manifest('backend', images, context);
  const frontend = manifest('frontend', images, context);
  assert.equal(backend.metadata.annotations['run.googleapis.com/invoker-iam-disabled'], 'false');
  assert.equal(backend.spec.template.metadata.annotations['run.googleapis.com/cloudsql-instances'],
    'cpe334-workflow-approval-2026:asia-southeast1:workflow-db');
  assert.equal(backend.spec.template.spec.containers[0].ports[0].containerPort, 8080);
  assert.equal(backend.spec.template.spec.containers[0].env.find(row => row.name === 'DATABASE_URL').valueFrom.secretKeyRef.key, '1');
  assert.equal(frontend.spec.template.spec.containers[0].ports[0].containerPort, 80);
  assert.equal(frontend.spec.template.spec.containers[1].ports, undefined);
  assert.ok(!JSON.stringify(frontend).includes('secretKeyRef'));
  for (const service of [backend, frontend]) {
    assert.equal(service.spec.template.metadata.annotations['autoscaling.knative.dev/minScale'], '0');
    assert.equal(service.spec.template.metadata.labels['release-sha'], sha);
    assert.deepEqual(service.spec.traffic, [{ latestRevision: true, percent: 100 }]);
  }
});
test('policy checks fail closed for a public backend or nonpublic frontend', () => {
  const principal = 'serviceAccount:workflow-frontend@cpe334-workflow-approval-2026.iam.gserviceaccount.com';
  assert.doesNotThrow(() => checkInvoker({ bindings: [{ role: 'roles/run.invoker', members: [principal] }] }, 'backend'));
  for (const member of ['allUsers', 'allAuthenticatedUsers']) {
    assert.throws(() => checkInvoker({ bindings: [{ role: 'roles/run.invoker', members: [principal, member] }] }, 'backend'));
  }
  assert.throws(() => checkInvoker({ bindings: [] }, 'frontend'));
  assert.throws(() => checkInvoker({ bindings: [] }, 'backend'));
});
test('snapshot refuses split traffic and checks the active revision, including after rollback', () => {
  const service = manifest('backend', images, context);
  service.metadata.resourceVersion = 'opaque-version-a';
  service.status = { url: settings.backend, latestReadyRevisionName: 'workflow-backend-00002-abc',
    traffic: [{ revisionName: 'workflow-backend-00002-abc', percent: 100 }] };
  assert.equal(serviceSnapshot(service, 'backend').revision, 'workflow-backend-00002-abc');
  assert.throws(() => serviceSnapshot({ ...service, status: { ...service.status, traffic: [] } }, 'backend'));
  const snapshot = serviceSnapshot({ ...service, status: { ...service.status, latestReadyRevisionName: 'newer-unused-revision' } }, 'backend');
  const revision = { metadata: { name: snapshot.revision }, spec: service.spec.template.spec,
    status: { conditions: [{ type: 'Ready', status: 'True' }] } };
  assert.deepEqual(readyRevision(revision, snapshot, 'backend').images, snapshot.images);
  assert.throws(() => readyRevision({ ...revision, status: { conditions: [{ type: 'Ready', status: 'False' }] } }, snapshot, 'backend'));
  assert.throws(() => readyRevision({ ...revision, metadata: { name: 'other' } }, snapshot, 'backend'));
});
function existingService(kind = 'backend') {
  const service = manifest(kind, images, context);
  service.metadata.resourceVersion = 'opaque-version-a';
  service.status = { url: settings[kind], traffic: [{ revisionName: 'workflow-' + kind + '-00002-abc', percent: 100 }] };
  return service;
}
test('stale main is rejected immediately before replacement, without a cloud mutation', () => {
  const service = existingService();
  const calls = [];
  const io = { describe: () => { calls.push('describe'); return service; },
    stage: value => { calls.push('stage'); assert.equal(value.metadata.resourceVersion, 'opaque-version-a'); return 'backend.yaml'; },
    readMain: () => { calls.push('main'); return 'c'.repeat(40); },
    replace: () => calls.push('replace') };
  assert.throws(() => guardedReplacement('backend', images, context, serviceSnapshot(service, 'backend'), io), /Main advanced/);
  assert.deepEqual(calls, ['describe', 'stage', 'main']);
  assert.doesNotThrow(() => assertCurrentMain(sha, () => sha));
});
test('replacement carries the opaque version and refuses drift or API conflicts without retry', () => {
  const original = existingService();
  const before = serviceSnapshot(original, 'backend');
  const changed = structuredClone(original);
  changed.metadata.resourceVersion = 'opaque-version-b';
  let mutations = 0;
  const io = { describe: () => changed, stage: () => 'backend.yaml', readMain: () => sha,
    replace: () => { mutations++; throw new Error('simulated API conflict'); } };
  assert.throws(() => guardedReplacement('backend', images, context, before, io), /Cloud Run changed/);
  assert.equal(mutations, 0);
  const order = [];
  io.describe = () => { order.push('describe'); return original; };
  io.stage = value => { order.push('stage'); assert.equal(value.metadata.resourceVersion, before.resourceVersion); return 'backend.yaml'; };
  io.readMain = () => { order.push('main'); return sha; };
  io.replace = file => { order.push('replace'); assert.equal(file, 'backend.yaml'); mutations++; throw new Error('simulated API conflict'); };
  assert.throws(() => guardedReplacement('backend', images, context, before, io), /simulated API conflict/);
  assert.equal(mutations, 1);
  assert.deepEqual(order, ['describe', 'stage', 'main', 'replace']);
  assert.equal(before.revision, 'workflow-backend-00002-abc');
  assert.equal(before.resourceVersion, 'opaque-version-a');
});
test('runtime drift is not silently overwritten; only the documented restart marker is removed', () => {
  const original = existingService();
  assert.doesNotThrow(() => assertServiceConfiguration(original, 'backend', images, context));
  const restart = structuredClone(original);
  restart.spec.template.spec.containers[0].env.push({ name: 'LAB5_RESTART_MARKER', value: '20261122120000' });
  assert.doesNotThrow(() => assertServiceConfiguration(restart, 'backend', images, context));
  for (const mutate of [
    value => { value.spec.template.spec.serviceAccountName = 'unexpected@example.test'; },
    value => { value.spec.template.metadata.annotations['run.googleapis.com/cloudsql-instances'] = 'another-database'; },
    value => { value.spec.template.spec.containers[0].env.find(row => row.name === 'DATABASE_URL').valueFrom.secretKeyRef.key = '2'; },
    value => { value.spec.template.spec.containers[0].env.push({ name: 'UNKNOWN_SETTING', value: 'unexpected' }); },
    value => { value.spec.template.spec.containers[0].ports[0].containerPort = 3000; },
  ]) {
    const drift = structuredClone(original); mutate(drift);
    assert.throws(() => assertServiceConfiguration(drift, 'backend', images, context), /configuration drift/);
  }
  const frontend = existingService('frontend');
  assert.doesNotThrow(() => assertServiceConfiguration(frontend, 'frontend', images, context));
  frontend.spec.template.spec.containers[0].env.find(row => row.name === 'BACKEND_AUTH_MODE').value = 'none';
  assert.throws(() => assertServiceConfiguration(frontend, 'frontend', images, context), /configuration drift/);
});
test('read-only smoke verifies both SHAs and exact 200/200/403/404 boundaries without credentials', async () => {
  const seen = [];
  const request = async (url, options) => {
    seen.push(url);
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.Authorization, undefined);
    const status = url.startsWith(settings.backend) ? 403 : url.endsWith('/_backend_identity') ? 404 : 200;
    return { status, json: async () => ({ releaseSha: sha }) };
  };
  await smoke(sha, request);
  assert.equal(seen.length, 6);
  await assert.rejects(smoke(sha, async () => ({ status: 200, json: async () => ({ releaseSha: 'wrong' }) })));
});
test('deployment workflow is main-only, disabled by default, serial and approval-scoped; PR CI validates the new contract', () => {
  const workflow = parse(readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8'));
  assert.deepEqual(workflow.on.push.branches, ['main']);
  assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'));
  assert.equal(workflow.on.pull_request, undefined);
  assert.match(workflow.jobs.deploy.if, /GCP_DEPLOY_ENABLED == 'true'/);
  assert.match(workflow.jobs.deploy.if, /refs\/heads\/main/);
  assert.equal(workflow.jobs.deploy.environment, 'lab5-production');
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
  assert.deepEqual(workflow.jobs.deploy.permissions, { contents: 'read', 'id-token': 'write' });
  assert.equal(workflow.jobs.verify.permissions['id-token'], undefined);
  const auth = workflow.jobs.deploy.steps.find(step => step.id === 'auth');
  assert.equal(auth.with.create_credentials_file, false);
  assert.equal(auth.with.export_environment_variables, false);
  assert.match(auth.with.service_account, /GCP_DEPLOY_SERVICE_ACCOUNT/);
  const evidence = workflow.jobs.deploy.steps.find(step => step.name === 'Preserve non-sensitive deployment evidence');
  assert.equal(evidence.with['include-hidden-files'], true);
  assert.ok(evidence.with.path.split('\n').filter(Boolean).every(value => /^\.local\/release\/[a-z-]+\.json$/.test(value)));
  for (const step of workflow.jobs.deploy.steps.filter(step => step.uses)) assert.match(step.uses, /@[a-f0-9]{40}$/);
  const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(ci, /node --test deploy\/test\/\*\.test\.mjs/);
  assert.match(ci, /npm audit --omit=dev --audit-level=high/);
  assert.match(JSON.stringify(workflow.jobs.verify.steps), /audit --omit=dev --audit-level=high/);
});
