import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from '../token-helper/node_modules/yaml/dist/index.js';
import { releaseContext, targets, verifiedImages, manifest, checkInvoker, serviceSnapshot, readyRevision,
  assertCurrentMain, assertServiceConfiguration, guardedReplacement, smoke, settings, command, publishImage } from '../release.mjs';

const sha = 'a'.repeat(40);
const env = { GITHUB_REPOSITORY: 'tm-georgia/workflow-and-approval-system', GITHUB_REF: 'refs/heads/main',
  GITHUB_EVENT_NAME: 'push', GITHUB_SHA: sha, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1',
  RUNTIME_DB_VERSION: '1', JWT_VERSION: '1' };
const context = releaseContext(env);
const images = Object.fromEntries(targets.map(({ name }) => [name, settings.registry + '/' + name + '@sha256:' + 'b'.repeat(64)]));
// Fixture schema verified from installed Cloud SDK 594.0.0, offline:
// command_lib/artifacts/docker_util.py:ListDockerTags maps each API tag to
// {image: img.GetDockerString(), tag: tag.name, version: tag.version}.
// requests.py:ListPackages/ListTags and third_party/apitools/base/py/list_pager.py
// consume every nextPageToken; core/resource/json_printer.py emits an array ([] if empty).
function listedTag(name = 'backend', tag = context.tag) {
  const packageName = 'projects/' + settings.project + '/locations/' + settings.region +
    '/repositories/' + settings.registry.split('/')[2] + '/packages/' + name.replaceAll('/', '%2F');
  return { image: settings.registry + '/' + name, tag: packageName + '/tags/' + tag,
    version: packageName + '/versions/sha256:' + 'b'.repeat(64) };
}

function mockedPublish({ rows = [], listing = JSON.stringify(rows), mainSha = sha,
  digest = 'sha256:' + 'b'.repeat(64), results = {} } = {}) {
  const calls = [];
  const execute = (binary, args, options) => {
    const operation = binary === 'git' ? 'main' : binary === 'docker' ? 'push' :
      args[2] === 'tags' ? 'list' : 'describe';
    calls.push({ operation, binary, args, options });
    if (Object.hasOwn(results, operation)) {
      return typeof results[operation] === 'function' ? results[operation]() : results[operation];
    }
    return { status: 0, signal: null, stderr: '',
      stdout: { list: listing, main: mainSha + '\trefs/heads/main\n', push: '', describe: digest }[operation] };
  };
  return { calls, run: (binary, args, options) => command(binary, args, options, execute) };
}

test('publish guard allows successful absence, a new tag and the same tag on a different image', async t => {
  for (const [label, rows] of [
    ['empty repository', []],
    ['new tag on existing image', [listedTag('backend', 'previous-run')]],
    ['same tag on other image', [listedTag('frontend')]],
    ['image prefix is a different image', [listedTag('backend-extra')]],
    ['tag prefix is a different tag', [listedTag('backend', context.tag + '-extra')]],
    ['nested image uses encoded package resource', [listedTag('backend/worker')]],
  ]) {
    await t.test(label, () => {
      const io = mockedPublish({ rows });
      assert.equal(publishImage('backend', context, io.run), images.backend);
      assert.deepEqual(io.calls.map(({ operation }) => operation), ['list', 'main', 'push', 'describe']);
      assert.deepEqual(io.calls.map(({ binary, args }) => [binary, args]), [
        ['gcloud', ['artifacts', 'docker', 'tags', 'list', settings.registry, '--format=json',
          '--project=' + settings.project, '--quiet']],
        ['git', ['ls-remote', 'origin', 'refs/heads/main']],
        ['docker', ['push', settings.registry + '/backend:' + context.tag]],
        ['gcloud', ['artifacts', 'docker', 'images', 'describe', settings.registry + '/backend:' + context.tag,
          '--format=value(image_summary.digest)', '--project=' + settings.project, '--quiet']],
      ]);
    });
  }
});

test('publish guard rejects an exact image/tag collision anywhere in the complete listing before push', async t => {
  for (const { name } of targets) {
    await t.test(name, () => {
      const rows = Array.from({ length: 105 }, (_, i) => listedTag(name, 'old-' + i));
      rows.push(listedTag('different-image'), listedTag(name));
      const io = mockedPublish({ rows });
      assert.throws(() => publishImage(name, context, io.run), /^Error: Refusing to overwrite an existing run tag\.$/);
      assert.deepEqual(io.calls.map(({ operation }) => operation), ['list']);
    });
  }
});

test('publish guard fails closed on invalid JSON, unexpected schema and incomplete listings', async t => {
  const row = listedTag();
  const missing = key => Object.fromEntries(Object.entries(row).filter(([name]) => name !== key));
  const sensitive = 'SENSITIVE_TOKEN_DO_NOT_EXPOSE';
  const cases = [
    ['empty output', ''], ['malformed JSON', '[{"secret":"' + sensitive + '"}'],
    ['truncated rows', JSON.stringify([listedTag('frontend'), row]).slice(0, -1)],
    ['trailing output', '[]\n' + sensitive],
    ['trailing newline in image', JSON.stringify([{ ...row, image: row.image + '\n' }])],
    ['trailing newline in tag', JSON.stringify([{ ...row, tag: row.tag + '\n' }])],
    ['trailing newline in version', JSON.stringify([{ ...row, version: row.version + '\n' }])],
    ['invalid image path separators', JSON.stringify([listedTag('backend..worker')])],
    ...[null, false, 1, sensitive, {}, { tags: [] }, { tags: [], nextPageToken: sensitive },
      { tags: [row], nextPageToken: sensitive }, [null], [[]], [sensitive], [false],
      [missing('image')], [missing('tag')], [missing('version')],
      [{ ...row, image: null }], [{ ...row, tag: 12 }], [{ ...row, version: {} }],
      [{ ...row, tag: context.tag }], [{ ...row, version: 'sha256:' + 'b'.repeat(64) }],
      [{ ...row, image: row.image + ':latest' }], [{ ...row, image: row.image + '/' }],
      [{ ...row, image: row.image.replace(settings.project, 'different-project') }],
      [{ ...row, tag: listedTag('frontend').tag }], [{ ...row, version: listedTag('frontend').version }],
      [{ ...row, tag: row.tag.replace('/tags/', '/unexpected/') }],
      [{ ...row, tag: row.tag + '/extra' }], [{ ...row, version: row.version + sensitive }],
      [{ ...row, nextPageToken: sensitive }], [row, { nextPageToken: sensitive }],
      [row, row], [listedTag('frontend'), { ...row, version: null }],
    ].map((value, index) => ['schema case ' + index, JSON.stringify(value)]),
  ];
  for (const [label, listing] of cases) {
    await t.test(label, () => {
      const io = mockedPublish({ listing });
      assert.throws(() => publishImage('backend', context, io.run), error => {
        assert.equal(error.message, 'Invalid or incomplete registry tag listing; stop before publishing.');
        assert.equal(error.cause, undefined);
        assert.ok(!error.stack.includes(sensitive));
        return true;
      });
      assert.deepEqual(io.calls.map(({ operation }) => operation), ['list']);
    });
  }
});

test('publish guard treats every listing error variant as fatal and never exposes sensitive stderr', async t => {
  const sensitive = 'SENSITIVE_TOKEN_DO_NOT_EXPOSE';
  for (const stderr of ['NOT_FOUND', 'Image not found.', 'UNAUTHENTICATED: expired access token',
    'PERMISSION_DENIED', 'DNS lookup failed', 'Connection reset', 'HTTP 503 Service Unavailable']) {
    await t.test(stderr, () => {
      // Even apparently complete, valid stdout cannot turn a failed command into absence.
      const io = mockedPublish({ results: { list: { status: 1, stdout: '[]', stderr: stderr + '\n' + sensitive } } });
      assert.throws(() => publishImage('backend', context, io.run), error => {
        assert.equal(error.message, 'Release command failed. No later operations executed.');
        assert.equal(error.cause, undefined);
        assert.ok(!error.stack.includes(stderr));
        assert.ok(!error.stack.includes(sensitive));
        return true;
      });
      assert.deepEqual(io.calls.map(({ operation }) => operation), ['list']);
    });
  }
  await t.test('successful listing ignores stderr content', () => {
    const io = mockedPublish({ results: { list: { status: 0, stdout: '[]', stderr: 'NOT_FOUND Image not found. ' + sensitive } } });
    assert.equal(publishImage('backend', context, io.run), images.backend);
  });
});

test('release command fails closed on process failures and sanitizes thrown errors, output and arguments', async t => {
  const sensitive = 'SENSITIVE_TOKEN_DO_NOT_EXPOSE';
  const processError = Object.assign(new Error(sensitive), { code: 'ENOBUFS' });
  for (const [label, result] of [
    ['spawn ENOENT', { status: null, error: Object.assign(new Error(sensitive), { code: 'ENOENT' }) }],
    ['buffer overflow with parseable partial stdout', { status: 0, error: processError, stdout: '[]' }],
    ['signal termination', { status: null, signal: 'SIGTERM', stdout: '[]' }],
    ['signal despite zero exit', { status: 0, signal: 'SIGTERM', stdout: '[]' }],
    ['nonzero exit', { status: 2, stdout: sensitive, stderr: sensitive }],
    ['missing exit status', { stdout: '[]' }],
    ['invalid exit status', { status: sensitive, stdout: '[]' }],
    ['missing stdout', { status: 0 }],
    ['unexpected result', undefined],
    ['spawn throws', () => { throw new Error(sensitive); }],
  ]) {
    await t.test(label, () => {
      const io = mockedPublish({ results: { list: result } });
      assert.throws(() => publishImage('backend', context, io.run), /^Error: Release command failed\. No later operations executed\.$/);
      assert.deepEqual(io.calls.map(({ operation }) => operation), ['list']);
      assert.throws(() => command(sensitive, [sensitive], { input: sensitive },
        typeof result === 'function' ? result : () => result), error => {
        assert.equal(error.message, 'Release command failed. No later operations executed.');
        assert.equal(error.cause, undefined);
        assert.ok(!error.stack.includes(sensitive));
        return true;
      });
    });
  }
  await t.test('successful commands preserve stdin handling and trimmed stdout', () => {
    assert.equal(command('docker', ['login', '--password-stdin'], { input: sensitive + '\n' }, (binary, args, options) => {
      assert.equal(binary, 'docker');
      assert.deepEqual(args, ['login', '--password-stdin']);
      assert.equal(options.input, sensitive + '\n');
      assert.equal(options.windowsHide, true);
      assert.equal(options.encoding, 'utf8');
      return { status: 0, signal: null, stdout: ' accepted\n', stderr: sensitive };
    }), 'accepted');
  });
});

test('publish guard preserves current-main and digest checks and stops after any subsequent command failure', async t => {
  await t.test('stale main prevents push', () => {
    const io = mockedPublish({ mainSha: 'c'.repeat(40) });
    assert.throws(() => publishImage('backend', context, io.run), /Main advanced/);
    assert.deepEqual(io.calls.map(({ operation }) => operation), ['list', 'main']);
  });
  for (const [operation, expected] of [
    ['main', ['list', 'main']], ['push', ['list', 'main', 'push']],
    ['describe', ['list', 'main', 'push', 'describe']],
  ]) {
    await t.test(operation + ' command failure is fatal', () => {
      const io = mockedPublish({ results: { [operation]: { status: 1, stdout: '', stderr: 'SENSITIVE_TOKEN_DO_NOT_EXPOSE' } } });
      assert.throws(() => publishImage('backend', context, io.run), /^Error: Release command failed\. No later operations executed\.$/);
      assert.deepEqual(io.calls.map(({ operation: value }) => value), expected);
    });
  }
  for (const digest of ['', 'latest', 'sha256:' + 'b'.repeat(63), 'sha256:' + 'B'.repeat(64),
    'sha256:' + 'b'.repeat(64) + '\nSENSITIVE_TOKEN_DO_NOT_EXPOSE']) {
    await t.test('invalid digest ' + digest.length, () => {
      const io = mockedPublish({ digest });
      assert.throws(() => publishImage('backend', context, io.run), /^Error: Registry did not return a valid digest\.$/);
      assert.deepEqual(io.calls.map(({ operation }) => operation), ['list', 'main', 'push', 'describe']);
    });
  }
});

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
