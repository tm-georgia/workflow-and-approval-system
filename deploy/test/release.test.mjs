import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from '../token-helper/node_modules/yaml/dist/index.js';
import { releaseContext, targets, verifiedImages, manifest, checkInvoker, serviceSnapshot, readyRevision,
  assertCurrentMain, assertServiceConfiguration, guardedReplacement, smoke, settings, command, publishImage,
  resolvePlatformImage, verifiedRevision, registryReader } from '../release.mjs';

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

const ociImage = 'application/vnd.oci.image.manifest.v1+json';
const ociIndex = 'application/vnd.oci.image.index.v1+json';
const dockerImage = 'application/vnd.docker.distribution.manifest.v2+json';
const dockerIndex = 'application/vnd.docker.distribution.manifest.list.v2+json';
function packedManifest(document) {
  const raw = JSON.stringify(document);
  return { raw, digest: 'sha256:' + createHash('sha256').update(raw).digest('hex'), size: Buffer.byteLength(raw) };
}
function registryFixture({ name = 'backend', index = true, docker = false, attestation = false,
  mutateChild = () => {}, mutateIndex = () => {} } = {}) {
  const childDocument = { schemaVersion: 2, mediaType: docker ? dockerImage : ociImage,
    config: { mediaType: docker ? 'application/vnd.docker.container.image.v1+json' : 'application/vnd.oci.image.config.v1+json',
      digest: 'sha256:' + '1'.repeat(64), size: 123 },
    layers: [{ mediaType: docker ? 'application/vnd.docker.image.rootfs.diff.tar.gzip' : 'application/vnd.oci.image.layer.v1.tar+gzip',
      digest: 'sha256:' + '2'.repeat(64), size: 456 }] };
  mutateChild(childDocument);
  const child = packedManifest(childDocument);
  const descriptors = [{ mediaType: childDocument.mediaType, digest: child.digest, size: child.size, platform: { os: 'linux', architecture: 'amd64' } }];
  if (attestation) descriptors.push({ mediaType: ociImage, digest: 'sha256:' + '3'.repeat(64), size: 564,
    platform: { os: 'unknown', architecture: 'unknown' }, annotations: {
      'vnd.docker.reference.type': 'attestation-manifest', 'vnd.docker.reference.digest': child.digest } });
  const parentDocument = { schemaVersion: 2, mediaType: docker ? dockerIndex : ociIndex, manifests: descriptors };
  mutateIndex(parentDocument);
  const parent = index ? packedManifest(parentDocument) : child;
  const prefix = settings.registry + '/' + name + '@';
  const image = prefix + parent.digest, platformImage = prefix + child.digest;
  const raw = new Map([[image, parent.raw], [platformImage, child.raw]]);
  const calls = [];
  const run = (binary, args, options) => {
    calls.push({ binary, args, options });
    assert.equal(binary, 'docker');
    assert.deepEqual(args.slice(0, 4), ['buildx', 'imagetools', 'inspect', '--raw']);
    assert.equal(options.trim, false);
    assert.ok(raw.has(args[4]), 'Only fixture registry reads may execute');
    return raw.get(args[4]) + '\n';
  };
  return { image, platformImage, parent, child, raw, calls, run };
}
const provenanceMessage = 'Ready revision provenance mismatch; stop and inspect rollback.json.';
function rejectsProvenance(action) {
  assert.throws(action, error => {
    assert.equal(error.message, provenanceMessage);
    assert.equal(error.cause, undefined);
    assert.ok(!error.stack.includes('SENSITIVE_TOKEN_DO_NOT_EXPOSE'));
    return true;
  });
}

test('OCI provenance resolves direct manifests and unique platform children in exact approved packages', async t => {
  for (const { name } of targets) {
    for (const options of [{ index: false }, {}, { attestation: true }, { docker: true }, { docker: true, index: false }]) {
      await t.test(name + ' ' + JSON.stringify(options), () => {
        const f = registryFixture({ name, ...options });
        assert.equal(resolvePlatformImage(name, f.image, f.run), f.platformImage);
        assert.deepEqual(f.calls.map(call => call.args[4]), options.index === false ? [f.image] : [f.image, f.platformImage]);
        assert.ok(f.calls.every(call => call.args[4].startsWith(settings.registry + '/' + name + '@sha256:')));
      });
    }
  }
  await t.test('other platform is not a competing AMD64 image', () => {
    const f = registryFixture({ mutateIndex: doc => doc.manifests.push({ ...doc.manifests[0], digest: 'sha256:' + '4'.repeat(64),
      platform: { os: 'linux', architecture: 'arm64', variant: 'v8' } }) });
    assert.equal(resolvePlatformImage('backend', f.image, f.run), f.platformImage);
  });
  await t.test('exact raw bytes are retained, including manifest whitespace', () => {
    const f = registryFixture({ index: false });
    const raw = ' \n' + f.child.raw + '\n';
    const digest = 'sha256:' + createHash('sha256').update(raw).digest('hex');
    const image = settings.registry + '/backend@' + digest;
    assert.equal(resolvePlatformImage('backend', image, () => raw + '\n'), image);
    assert.equal(command('docker', [], { trim: false }, () => ({ status: 0, stdout: raw })), raw);
  });
});

test('OCI provenance registry reads reuse publish authentication only in child processes', () => {
  const f = registryFixture();
  const runnerTemp = path.resolve('mock-runner-temp');
  const envBefore = process.env.DOCKER_CONFIG;
  const inputEnv = { RUNNER_TEMP: runnerTemp, DOCKER_CONFIG: 'unrelated-config' };
  let calls = 0;
  const run = registryReader(inputEnv, (binary, args, options) => {
    calls++;
    assert.deepEqual(options.env, { DOCKER_CONFIG: path.join(runnerTemp, 'lab5-docker') });
    return command(binary, args, options, (_binary, _args, processOptions) => {
      assert.equal(processOptions.env.DOCKER_CONFIG, path.join(runnerTemp, 'lab5-docker'));
      assert.equal(processOptions.windowsHide, true);
      assert.equal(processOptions.encoding, 'utf8');
      return { status: 0, stdout: f.raw.get(args[4]) + '\n' };
    });
  });
  assert.equal(resolvePlatformImage('backend', f.image, run), f.platformImage);
  assert.equal(calls, 2);
  assert.equal(inputEnv.DOCKER_CONFIG, 'unrelated-config');
  assert.equal(process.env.DOCKER_CONFIG, envBefore);
  for (const RUNNER_TEMP of [undefined, '', 'relative/path']) rejectsProvenance(() => registryReader({ RUNNER_TEMP }));
  const workflow = parse(readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8'));
  assert.equal(workflow.jobs.deploy.steps.find(step => step.name === 'Upload immutable images').env.DOCKER_CONFIG,
    '${{ runner.temp }}/lab5-docker');
});

test('OCI provenance rejects missing, duplicate, ambiguous, malformed and attestation platform entries', async t => {
  const cases = [
    ['missing AMD64', doc => { doc.manifests[0].platform.architecture = 'arm64'; }],
    ['empty listing', doc => { doc.manifests = []; }],
    ['missing listing', doc => { delete doc.manifests; }],
    ['listing wrapper', doc => { doc.manifests = { items: doc.manifests }; }],
    ['duplicate descriptor', doc => { doc.manifests.push(structuredClone(doc.manifests[0])); }],
    ['competing child', doc => { doc.manifests.push({ ...doc.manifests[0], digest: 'sha256:' + '4'.repeat(64) }); }],
    ['nested index', doc => { doc.manifests[0].mediaType = ociIndex; }],
    ['unsupported parent', doc => { doc.mediaType = 'application/unknown'; }],
    ['wrong schema', doc => { doc.schemaVersion = 1; }],
    ['mixed manifest/index', doc => { doc.layers = []; }],
    ['incomplete paginated response', doc => { doc.nextPageToken = 'SENSITIVE_TOKEN_DO_NOT_EXPOSE'; }],
    ['null descriptor', doc => { doc.manifests.push(null); }],
    ...['platform', 'digest', 'size', 'mediaType'].map(key => ['missing ' + key, doc => { delete doc.manifests[0][key]; }]),
    ['null platform', doc => { doc.manifests[0].platform = null; }],
    ['array platform', doc => { doc.manifests[0].platform = []; }],
    ['missing architecture', doc => { delete doc.manifests[0].platform.architecture; }],
    ['non-string architecture', doc => { doc.manifests[0].platform.architecture = 123; }],
    ['platform whitespace', doc => { doc.manifests[0].platform.os = 'linux\n'; }],
    ['malformed additional platform', doc => { doc.manifests.push({ ...doc.manifests[0], digest: 'sha256:' + '4'.repeat(64),
      platform: { os: 'linux\n', architecture: 'arm64' } }); }],
    ['unexpected platform variant', doc => { doc.manifests[0].platform.variant = 'v3'; }],
    ['unexpected platform features', doc => { doc.manifests[0].platform['os.features'] = []; }],
    ['unexpected platform field', doc => { doc.manifests[0].platform.url = 'other.example'; }],
    ['invalid size', doc => { doc.manifests[0].size = '2005'; }],
    ['negative size', doc => { doc.manifests[0].size = -1; }],
    ['incorrect child size', doc => { doc.manifests[0].size++; }],
    ['incorrect child media type', doc => { doc.manifests[0].mediaType = dockerImage; }],
    ['invalid child digest', doc => { doc.manifests[0].digest = 'sha256:' + 'a'.repeat(64) + '\n'; }],
    ['external descriptor URL', doc => { doc.manifests[0].urls = ['https://other.example']; }],
    ['inline descriptor', doc => { doc.manifests[0].data = 'untrusted'; }],
    ['invalid annotations', doc => { doc.manifests[0].annotations = { secret: {} }; }],
    ['attestation masquerading as image', doc => { doc.manifests[0].annotations = { 'vnd.docker.reference.type': 'attestation-manifest' }; }],
    ['unknown platform without attestation', doc => { doc.manifests[0].platform = { os: 'unknown', architecture: 'unknown' }; }],
    ['mixed unknown platform', doc => { doc.manifests[0].platform.architecture = 'unknown'; }],
  ];
  for (const [label, mutateIndex] of cases) await t.test(label, () => {
    const f = registryFixture({ mutateIndex });
    rejectsProvenance(() => resolvePlatformImage('backend', f.image, f.run));
  });
  for (const [label, mutate] of [
    ['dangling attestation', entry => { entry.annotations['vnd.docker.reference.digest'] = 'sha256:' + 'f'.repeat(64); }],
    ['untyped attestation', entry => { delete entry.annotations['vnd.docker.reference.type']; }],
    ['attestation cannot replace AMD64', entry => { entry.platform = { os: 'linux', architecture: 'amd64' }; }],
  ]) await t.test(label, () => {
    const f = registryFixture({ attestation: true, mutateIndex: doc => mutate(doc.manifests[1]) });
    rejectsProvenance(() => resolvePlatformImage('backend', f.image, f.run));
  });
});

test('OCI provenance fails closed on malformed image manifests, digest mismatches and registry/process failures', async t => {
  for (const [label, mutateChild] of [
    ['missing config', doc => { delete doc.config; }], ['missing layers', doc => { delete doc.layers; }],
    ['wrong config media type', doc => { doc.config.mediaType = 'application/unknown'; }],
    ['wrong layer media type', doc => { doc.layers[0].mediaType = 'application/vnd.in-toto+json'; }],
    ['wrong layer digest', doc => { doc.layers[0].digest = 'latest'; }],
    ['wrong layer size', doc => { doc.layers[0].size = null; }],
    ['nested manifest', doc => { doc.manifests = []; }],
    ['artifact instead of image', doc => { doc.artifactType = 'application/example'; }],
  ]) await t.test(label, () => {
    const f = registryFixture({ mutateChild });
    rejectsProvenance(() => resolvePlatformImage('backend', f.image, f.run));
  });
  const sensitive = 'SENSITIVE_TOKEN_DO_NOT_EXPOSE';
  for (const output of ['', '{' + sensitive, '{}', '[]', 'null', '{"schemaVersion":2}', JSON.stringify({ schemaVersion: 2, mediaType: 'application/unknown' })]) {
    await t.test('invalid response ' + output.length, () => {
      const ref = settings.registry + '/backend@sha256:' + createHash('sha256').update(output).digest('hex');
      rejectsProvenance(() => resolvePlatformImage('backend', ref, () => output));
    });
  }
  for (const part of ['parent', 'child']) await t.test(part + ' wrong bytes despite valid JSON', () => {
    const f = registryFixture(); f.raw.set(part === 'parent' ? f.image : f.platformImage, registryFixture({ index: false }).child.raw + ' ');
    rejectsProvenance(() => resolvePlatformImage('backend', f.image, f.run));
  });
  await t.test('unrelated descriptor cannot authorize the running image', () => {
    const f = registryFixture({ mutateIndex: doc => { doc.manifests[0].digest = 'sha256:' + 'f'.repeat(64); } });
    rejectsProvenance(() => resolvePlatformImage('backend', f.image, f.run));
  });
  for (const stage of ['parent', 'child']) for (const result of [
    { status: 1, stdout: '{}', stderr: 'UNAUTHENTICATED ' + sensitive },
    { status: 1, stdout: '{}', stderr: 'PERMISSION_DENIED ' + sensitive },
    { status: 1, stdout: '', stderr: '404 missing manifest ' + sensitive },
    { status: 1, stdout: '', stderr: 'DNS/network/503 ' + sensitive },
    { status: null, signal: 'SIGTERM', stdout: '{}' },
    { status: 0, error: new Error(sensitive), stdout: '{}' },
    () => { throw new Error(sensitive); },
  ]) await t.test(stage + ' command failure', () => {
    const f = registryFixture();
    const run = (binary, args, options) => command(binary, args, options, () => {
      if (stage === 'parent' || args[4] === f.platformImage) return typeof result === 'function' ? result() : result;
      return { status: 0, stdout: f.raw.get(args[4]) };
    });
    rejectsProvenance(() => resolvePlatformImage('backend', f.image, run));
  });
  for (const ref of ['other.example/backend@sha256:' + 'a'.repeat(64), images.frontend, images.backend + '\n',
    settings.registry + '/backend:latest', images.backend.replace('/backend@', '/backend-extra@')]) await t.test('wrong package/reference', () => {
    rejectsProvenance(() => resolvePlatformImage('backend', ref, () => assert.fail('Must reject before registry read')));
  });
});

function revisionFixture(kind = 'backend') {
  const service = existingService(kind);
  const revisionName = service.status.traffic[0].revisionName;
  service.status.latestReadyRevisionName = revisionName;
  service.status.latestCreatedRevisionName = revisionName;
  const published = { ...images }, platformImages = { ...images }, registries = [];
  for (const name of kind === 'backend' ? ['backend'] : ['frontend', 'token-helper']) {
    const f = registryFixture({ name, attestation: true }); registries.push(f);
    published[name] = f.image; platformImages[name] = resolvePlatformImage(name, f.image, f.run);
  }
  for (const container of service.spec.template.spec.containers) container.image = published[container.name === 'nginx' ? 'frontend' : container.name];
  const spec = structuredClone(service.spec.template.spec);
  for (const container of spec.containers) container.image = platformImages[container.name === 'nginx' ? 'frontend' : container.name];
  const revision = { metadata: { name: revisionName, labels: { 'release-sha': sha } }, spec,
    status: { conditions: [{ type: 'Ready', status: 'True' }], containerStatuses: spec.containers.map(c => ({ name: c.name, imageDigest: c.image })) } };
  if (kind === 'backend') revision.status.imageDigest = platformImages.backend;
  return { service, revision, published, platformImages, registries };
}
test('OCI provenance verifies configured parents and actual serving children for backend and both frontend containers', async t => {
  for (const kind of ['backend', 'frontend']) await t.test(kind, () => {
    const f = revisionFixture(kind);
    const after = verifiedRevision(f.service, f.revision, kind, f.published, f.platformImages, context);
    assert.deepEqual(after.images, f.revision.spec.containers.map(c => ({ name: c.name, image: c.image })));
    assert.doesNotThrow(() => assertServiceConfiguration(f.service, kind, f.published, context));
    const originalService = structuredClone(f.service);
    // Rollback snapshots must still capture the actual traffic-serving child images.
    assert.deepEqual(readyRevision(f.revision, serviceSnapshot(f.service, kind), kind).images, after.images);
    assert.deepEqual(f.service, originalService);
  });
});
test('OCI provenance rejects incorrect configuration, release labels, runtime images, traffic and revision state', async t => {
  const cases = [
    ['wrong label', f => { f.revision.metadata.labels['release-sha'] = 'c'.repeat(40); }],
    ['missing label', f => { delete f.revision.metadata.labels; }],
    ['wrong configured image', f => { f.service.spec.template.spec.containers[0].image = f.platformImages.backend; }],
    ['wrong runtime image', f => { f.revision.spec.containers[0].image = images.backend; }],
    ['index reference cannot stand in for resolved child', f => { f.revision.spec.containers[0].image = f.published.backend; }],
    ['wrong runtime status digest', f => { f.revision.status.containerStatuses[0].imageDigest = images.backend; }],
    ['wrong primary digest', f => { f.revision.status.imageDigest = images.backend; }],
    ['missing status images', f => { delete f.revision.status.containerStatuses; }],
    ['not ready', f => { f.revision.status.conditions[0].status = 'False'; }],
    ['wrong revision identity', f => { f.revision.metadata.name = 'other'; }],
    ['wrong runtime identity', f => { f.revision.spec.serviceAccountName = 'unexpected@example.test'; }],
    ['split traffic', f => { f.service.status.traffic[0].percent = 50; }],
    ['older serving revision', f => { f.service.status.latestReadyRevisionName = 'newer'; }],
    ['newer pending revision', f => { f.service.status.latestCreatedRevisionName = 'newer'; }],
    ['duplicate containers', f => { f.revision.spec.containers.push(f.revision.spec.containers[0]); }],
    ['duplicate status', f => { f.revision.status.containerStatuses.push(f.revision.status.containerStatuses[0]); }],
    ['unexpected configured container', f => { f.service.spec.template.spec.containers.push({ name: 'extra', image: images.backend }); }],
    ['wrong resolved package', f => { f.platformImages.backend = f.revision.spec.containers[0].image = f.revision.status.imageDigest =
      f.revision.status.containerStatuses[0].imageDigest = images.frontend; }],
  ];
  for (const [label, mutate] of cases) await t.test(label, () => {
    const f = revisionFixture(); mutate(f);
    rejectsProvenance(() => verifiedRevision(f.service, f.revision, 'backend', f.published, f.platformImages, context));
  });
  for (const container of ['nginx', 'token-helper']) for (const field of ['configured', 'revision', 'status']) await t.test(container + ' wrong ' + field, () => {
    const f = revisionFixture('frontend');
    const rows = field === 'configured' ? f.service.spec.template.spec.containers : field === 'revision' ? f.revision.spec.containers : f.revision.status.containerStatuses;
    rows.find(c => c.name === container)[field === 'status' ? 'imageDigest' : 'image'] = images.backend;
    rejectsProvenance(() => verifiedRevision(f.service, f.revision, 'frontend', f.published, f.platformImages, context));
  });
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
