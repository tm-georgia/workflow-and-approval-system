import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { renderService } from './render-cloudrun.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireHelper = createRequire(new URL('./token-helper/package.json', import.meta.url));
const { parse, stringify } = requireHelper('yaml');
export const settings = Object.freeze({
  project: 'cpe334-workflow-approval-2026', region: 'asia-southeast1',
  registry: 'asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval',
  frontend: 'https://workflow-frontend-wkjzb522ga-as.a.run.app',
  backend: 'https://workflow-backend-wkjzb522ga-as.a.run.app',
  schemaBase: 'ef521b600b3548449487df7eeda5f5cea076c4a1',
});
export const targets = Object.freeze([
  { name: 'operations', context: 'server', target: 'operations' },
  { name: 'backend', context: 'server', target: 'production' },
  { name: 'frontend', context: 'client', target: 'production' },
  { name: 'token-helper', context: 'deploy/token-helper', target: 'production' },
]);
const shaPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const numericVersion = /^[1-9][0-9]*$/;

export function releaseContext(env) {
  if (env.GITHUB_REPOSITORY !== 'tm-georgia/workflow-and-approval-system' ||
      env.GITHUB_REF !== 'refs/heads/main' || !['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME) ||
      !shaPattern.test(env.GITHUB_SHA ?? '') || !/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID ?? '') ||
      !/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ATTEMPT ?? '')) throw new Error('Only an identified main release is allowed.');
  for (const name of ['RUNTIME_DB_VERSION', 'JWT_VERSION']) {
    if (!numericVersion.test(env[name] ?? '')) throw new Error('Pin numeric runtime secret versions.');
  }
  return { sha: env.GITHUB_SHA, tag: env.GITHUB_SHA + '-' + env.GITHUB_RUN_ID + '-' + env.GITHUB_RUN_ATTEMPT,
    dbVersion: env.RUNTIME_DB_VERSION, jwtVersion: env.JWT_VERSION };
}

export function command(binary, args, { input, trim = true, env } = {}, execute = spawnSync) {
  let result;
  const failed = () => new Error('Release command failed. No later operations executed.');
  try {
    result = execute(binary, args, { cwd: workspace, encoding: 'utf8', input, windowsHide: true,
      ...(env === undefined ? {} : { env: { ...process.env, ...env } }) });
  } catch {
    throw failed();
  }
  // Never echo arguments, child output or process errors: they can contain secrets.
  if (!result || result.error || result.status !== 0 || result.signal != null || typeof result.stdout !== 'string') throw failed();
  return trim ? result.stdout.trim() : result.stdout;
}
const cloudArgs = ['--project=' + settings.project, '--region=' + settings.region, '--quiet'];
function cloud(args, options) { return command('gcloud', [...args, ...cloudArgs], options); }
function artifact(args, options, run = command) {
  return run('gcloud', ['artifacts', 'docker', ...args, '--project=' + settings.project, '--quiet'], options);
}

function assertAvailableRunTag(output, image, tag) {
  const invalid = () => new Error('Invalid or incomplete registry tag listing; stop before publishing.');
  let rows;
  try { rows = JSON.parse(output); } catch { throw invalid(); }
  if (!Array.isArray(rows)) throw invalid();
  const repository = 'projects/' + settings.project + '/locations/' + settings.region +
    '/repositories/' + settings.registry.split('/')[2];
  const seen = new Set();
  let collision = false;
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row) ||
        Object.keys(row).sort().join(',') !== 'image,tag,version' ||
        typeof row.image !== 'string' || typeof row.tag !== 'string' || typeof row.version !== 'string' ||
        !row.image.startsWith(settings.registry + '/') ||
        [row.image, row.tag, row.version].some(value => /\s/.test(value))) throw invalid();
    const imagePath = row.image.slice(settings.registry.length + 1);
    if (!imagePath.split('/').every(part => /^[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*$/.test(part))) throw invalid();
    const packageName = repository + '/packages/' + imagePath.replaceAll('/', '%2F');
    const tagPrefix = packageName + '/tags/';
    const versionPrefix = packageName + '/versions/';
    if (!row.tag.startsWith(tagPrefix) || !/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/.test(row.tag.slice(tagPrefix.length)) ||
        !row.version.startsWith(versionPrefix) || !digestPattern.test(row.version.slice(versionPrefix.length)) ||
        seen.has(row.tag)) throw invalid();
    seen.add(row.tag);
    if (row.image === image && row.tag === tagPrefix + tag) collision = true;
  }
  if (collision) throw new Error('Refusing to overwrite an existing run tag.');
}

export function publishImage(name, context, run = command) {
  const image = settings.registry + '/' + name;
  const tag = image + ':' + context.tag;
  // Verified offline against Cloud SDK 594.0.0:
  // surface/artifacts/docker/tags/list.py -> command_lib/artifacts/docker_util.py
  // ListDockerTags emits [{image: Docker URL, tag: full tag resource, version: full version resource}].
  // requests.ListPackages/ListTags exhaust the SDK pager before returning. Do not add
  // --limit, --filter or a format projection: absence requires the complete listing.
  assertAvailableRunTag(artifact(['tags', 'list', settings.registry, '--format=json'], undefined, run), image, context.tag);
  assertCurrentMain(context.sha, () => run('git', ['ls-remote', 'origin', 'refs/heads/main']).split(/\s/)[0]);
  run('docker', ['push', tag]);
  const digest = artifact(['images', 'describe', tag, '--format=value(image_summary.digest)'], undefined, run);
  if (!digestPattern.test(digest)) throw new Error('Registry did not return a valid digest.');
  return image + '@' + digest;
}
const outputDirectory = path.join(workspace, '.local', 'release');
function save(name, value) {
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(path.join(outputDirectory, name), JSON.stringify(value, null, 2) + '\n');
}
function load(name) { return JSON.parse(readFileSync(path.join(outputDirectory, name), 'utf8')); }
function serviceAccount(kind) { return 'workflow-' + kind + '@' + settings.project + '.iam.gserviceaccount.com'; }
export function verifiedImages(record, context) {
  if (record.sha !== context.sha || record.tag !== context.tag) throw new Error('Image provenance does not match this run.');
  for (const { name } of targets) {
    if (typeof record.images?.[name] !== 'string' ||
        !record.images[name].startsWith(settings.registry + '/' + name + '@') ||
        !digestPattern.test(record.images[name].split('@')[1] ?? '')) throw new Error('Missing approved immutable image.');
  }
  return record.images;
}
export function manifest(kind, images, context, resourceVersion) {
  const values = kind === 'backend'
    ? { 'backend-image': images.backend, 'service-account': serviceAccount('backend'),
      'reviewer-email': 'lab5-reviewer@example.test', 'runtime-db-version': context.dbVersion, 'jwt-version': context.jwtVersion }
    : { 'nginx-image': images.frontend, 'helper-image': images['token-helper'], 'backend-url': settings.backend,
      'service-account': serviceAccount('frontend') };
  const service = parse(renderService(kind, values));
  service.spec.template.metadata.labels = { 'release-sha': context.sha };
  service.spec.traffic = [{ latestRevision: true, percent: 100 }];
  if (resourceVersion !== undefined) service.metadata.resourceVersion = resourceVersion;
  return service;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
function runtimeSettings(service, kind) {
  const spec = service.spec?.template?.spec ?? {};
  const annotations = service.spec?.template?.metadata?.annotations ?? {};
  const containers = (spec.containers ?? []).map(container => ({
    name: container.name,
    ports: (container.ports ?? []).map(port => port.containerPort),
    volumeMounts: container.volumeMounts ?? [],
    env: (container.env ?? []).filter(row => {
      if (kind !== 'backend' || row.name !== 'LAB5_RESTART_MARKER') return true;
      if (typeof row.value !== 'string' || !/^\d{14}$/.test(row.value) || row.valueFrom) throw new Error('Unexpected restart marker; stop for review.');
      return false; // The documented Issue 8 marker is deliberately removed on redeploy.
    }).map(row => {
      if (!row.valueFrom?.secretKeyRef) return row;
      const ref = { ...row.valueFrom.secretKeyRef };
      for (const project of [settings.project, '597719179612']) {
        const prefix = 'projects/' + project + '/secrets/';
        if (ref.name?.startsWith(prefix)) ref.name = ref.name.slice(prefix.length);
      }
      return { ...row, valueFrom: { ...row.valueFrom, secretKeyRef: ref } };
    }).sort((a, b) => a.name.localeCompare(b.name)),
  })).sort((a, b) => a.name.localeCompare(b.name));
  const dependency = annotations['run.googleapis.com/container-dependencies'];
  return canonical({
    serviceAccountName: spec.serviceAccountName,
    ingress: service.metadata?.annotations?.['run.googleapis.com/ingress'] ?? 'all',
    invokerIamDisabled: service.metadata?.annotations?.['run.googleapis.com/invoker-iam-disabled'] ?? 'false',
    sql: annotations['run.googleapis.com/cloudsql-instances'] ?? '',
    dependencies: dependency ? JSON.parse(dependency) : {},
    concurrency: spec.containerConcurrency, timeout: spec.timeoutSeconds,
    volumes: spec.volumes ?? [], containers,
  });
}
export function assertServiceConfiguration(service, kind, images, context) {
  if (JSON.stringify(runtimeSettings(service, kind)) !== JSON.stringify(runtimeSettings(manifest(kind, images, context), kind))) {
    // Do not echo environment values or raw service configuration.
    throw new Error('Runtime identity, API/sidecar, SQL or environment/secret configuration drift; stop for review.');
  }
}
export function assertCurrentMain(expectedSha, readMain = () => command('git', ['ls-remote', 'origin', 'refs/heads/main']).split(/\s/)[0]) {
  if (readMain() !== expectedSha) throw new Error('Main advanced while this release waited; stop rather than deploy an older head.');
}
export function guardedReplacement(kind, images, context, before, io) {
  const current = io.describe(kind);
  const snapshot = serviceSnapshot(current, kind);
  if (snapshot.resourceVersion !== before.resourceVersion || snapshot.revision !== before.revision) {
    throw new Error('Cloud Run changed after the rollback snapshot; stop without retrying.');
  }
  assertServiceConfiguration(current, kind, images, context);
  const file = io.stage(manifest(kind, images, context, snapshot.resourceVersion));
  assertCurrentMain(context.sha, io.readMain);
  // The API checks resourceVersion again, closing the read-to-update race.
  return io.replace(file);
}
export function serviceSnapshot(service, kind) {
  const spec = service.spec?.template?.spec;
  const active = service.status?.traffic?.filter(row => row.percent > 0) ?? [];
  if (service.metadata?.name !== 'workflow-' + kind || spec?.serviceAccountName !== serviceAccount(kind) ||
      service.metadata.annotations?.['run.googleapis.com/invoker-iam-disabled'] === 'true' ||
      service.status?.url !== settings[kind] || active.length !== 1 || active[0].percent !== 100 ||
      !active[0].revisionName || typeof service.metadata.resourceVersion !== 'string' || !service.metadata.resourceVersion) {
    throw new Error('Unexpected service identity, URL, IAM setting or traffic split; stop for review.');
  }
  return { service: service.metadata.name, resourceVersion: service.metadata.resourceVersion, revision: active[0].revisionName, url: service.status.url,
    images: spec.containers.map(container => ({ name: container.name, image: container.image })) };
}
export function readyRevision(revision, snapshot, kind) {
  if (revision.metadata?.name !== snapshot.revision || revision.spec?.serviceAccountName !== serviceAccount(kind) ||
      !revision.status?.conditions?.some(row => row.type === 'Ready' && row.status === 'True')) {
    throw new Error('The traffic-serving revision is not verified ready with the approved identity.');
  }
  // After a rollback the service template can describe a different, newer revision.
  // Evidence and rollback must record the actual traffic-serving revision's images.
  return { ...snapshot, images: revision.spec.containers.map(container => ({ name: container.name, image: container.image })) };
}

const imageMedia = ['application/vnd.oci.image.manifest.v1+json', 'application/vnd.docker.distribution.manifest.v2+json'];
const indexMedia = ['application/vnd.oci.image.index.v1+json', 'application/vnd.docker.distribution.manifest.list.v2+json'];
const provenanceFailure = () => new Error('Ready revision provenance mismatch; stop and inspect rollback.json.');

export function registryReader(env, run = command) {
  if (typeof env.RUNNER_TEMP !== 'string' || !path.isAbsolute(env.RUNNER_TEMP)) throw provenanceFailure();
  // deploy.yml sets DOCKER_CONFIG only on publish. Reuse that same directory
  // for read-only child processes without changing credentials or global env.
  const dockerConfig = path.join(env.RUNNER_TEMP, 'lab5-docker');
  return (binary, args, options) => run(binary, args, { ...options, env: { DOCKER_CONFIG: dockerConfig } });
}

export function resolvePlatformImage(name, image, run = command) {
  try {
    const packageName = settings.registry + '/' + name;
    const digest = image?.slice(packageName.length + 1);
    const validDigest = value => typeof value === 'string' && value.length === 71 && digestPattern.test(value);
    if (!targets.some(target => target.name === name) || !validDigest(digest) || image !== packageName + '@' + digest) throw provenanceFailure();
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const descriptor = value => object(value) && validDigest(value.digest) && Number.isSafeInteger(value.size) && value.size > 0 &&
      typeof value.mediaType === 'string' && !Object.hasOwn(value, 'urls') && !Object.hasOwn(value, 'data') &&
      (value.annotations === undefined || (object(value.annotations) && Object.values(value.annotations).every(item => typeof item === 'string')));
    const read = expected => {
      // Uses the workflow's existing ephemeral Docker authentication; never changes it.
      const output = run('docker', ['buildx', 'imagetools', 'inspect', '--raw', packageName + '@' + expected], { trim: false });
      if (typeof output !== 'string') throw provenanceFailure();
      // buildx appends one framing newline. Preserve all manifest bytes for hashing.
      const bytes = [output, ...(output.endsWith('\n') ? [output.slice(0, -1)] : [])]
        .find(value => 'sha256:' + createHash('sha256').update(value).digest('hex') === expected);
      if (bytes === undefined) throw provenanceFailure();
      const document = JSON.parse(bytes);
      if (!object(document) || document.schemaVersion !== 2 ||
          Object.keys(document).some(key => !['schemaVersion', 'mediaType', 'manifests', 'config', 'layers', 'annotations'].includes(key)) ||
          (document.annotations !== undefined && (!object(document.annotations) ||
            Object.values(document.annotations).some(value => typeof value !== 'string')))) throw provenanceFailure();
      return { document, size: Buffer.byteLength(bytes) };
    };
    const validateImage = document => {
      const oci = document.mediaType === imageMedia[0];
      const layerMedia = oci
        ? ['application/vnd.oci.image.layer.v1.tar', 'application/vnd.oci.image.layer.v1.tar+gzip', 'application/vnd.oci.image.layer.v1.tar+zstd']
        : ['application/vnd.docker.image.rootfs.diff.tar', 'application/vnd.docker.image.rootfs.diff.tar.gzip'];
      if (!imageMedia.includes(document.mediaType) || Object.hasOwn(document, 'manifests') ||
          Object.hasOwn(document, 'artifactType') || Object.hasOwn(document, 'subject') || !descriptor(document.config) ||
          document.config.mediaType !== (oci ? 'application/vnd.oci.image.config.v1+json' : 'application/vnd.docker.container.image.v1+json') ||
          !Array.isArray(document.layers) || document.layers.some(layer => !descriptor(layer) || !layerMedia.includes(layer.mediaType))) throw provenanceFailure();
    };
    const parent = read(digest).document;
    if (imageMedia.includes(parent.mediaType)) {
      validateImage(parent);
      return image;
    }
    if (!indexMedia.includes(parent.mediaType) || !Array.isArray(parent.manifests) || !parent.manifests.length ||
        Object.hasOwn(parent, 'config') || Object.hasOwn(parent, 'layers') || Object.hasOwn(parent, 'subject') ||
        Object.hasOwn(parent, 'artifactType')) throw provenanceFailure();
    const seen = new Set();
    const candidates = [], attestations = [], runnable = [];
    for (const entry of parent.manifests) {
      const platform = entry?.platform;
      if (!descriptor(entry) || !imageMedia.includes(entry.mediaType) || seen.has(entry.digest) || !object(platform) ||
          !['os', 'architecture'].every(key => typeof platform[key] === 'string' && !/\s/.test(platform[key]) && /^[a-z0-9][a-z0-9_.-]*$/.test(platform[key])) ||
          Object.keys(platform).some(key => !['os', 'architecture', 'variant', 'os.version', 'os.features'].includes(key)) ||
          ['variant', 'os.version'].some(key => platform[key] !== undefined && (typeof platform[key] !== 'string' || !platform[key] || /\s/.test(platform[key]))) ||
          (platform['os.features'] !== undefined && (!Array.isArray(platform['os.features']) ||
            platform['os.features'].some(item => typeof item !== 'string' || !item || /\s/.test(item))))) throw provenanceFailure();
      seen.add(entry.digest);
      const annotations = entry.annotations ?? {};
      if (platform.os === 'unknown' || platform.architecture === 'unknown') {
        if (platform.os !== 'unknown' || platform.architecture !== 'unknown' || Object.keys(platform).length !== 2 ||
            entry.mediaType !== imageMedia[0] || annotations['vnd.docker.reference.type'] !== 'attestation-manifest' ||
            !validDigest(annotations['vnd.docker.reference.digest'])) throw provenanceFailure();
        attestations.push(entry);
      } else {
        if (annotations['vnd.docker.reference.type'] !== undefined || annotations['vnd.docker.reference.digest'] !== undefined) throw provenanceFailure();
        runnable.push(entry);
        if (platform.os === 'linux' && platform.architecture === 'amd64') {
          if (Object.keys(platform).length !== 2) throw provenanceFailure();
          candidates.push(entry);
        }
      }
    }
    if (candidates.length !== 1 || attestations.some(entry => !runnable.some(item => item.digest === entry.annotations['vnd.docker.reference.digest']))) throw provenanceFailure();
    const selected = candidates[0];
    const child = read(selected.digest);
    if (child.size !== selected.size || child.document.mediaType !== selected.mediaType) throw provenanceFailure();
    validateImage(child.document);
    return packageName + '@' + selected.digest;
  } catch {
    // Registry output and process errors may contain credentials; never propagate them.
    throw provenanceFailure();
  }
}

export function verifiedRevision(service, revision, kind, images, platformImages, context) {
  try {
    const snapshot = serviceSnapshot(service, kind);
    const after = readyRevision(revision, snapshot, kind);
    const expected = kind === 'backend' ? { backend: 'backend' } : kind === 'frontend' ? { nginx: 'frontend', 'token-helper': 'token-helper' } : null;
    if (!expected || service.status.latestReadyRevisionName !== snapshot.revision ||
        service.status.latestCreatedRevisionName !== snapshot.revision || revision.metadata.labels?.['release-sha'] !== context.sha) throw provenanceFailure();
    for (const name of Object.values(expected)) {
      for (const reference of [images[name], platformImages[name]]) {
        const prefix = settings.registry + '/' + name + '@';
        if (typeof reference !== 'string' || !reference.startsWith(prefix) || reference.length !== prefix.length + 71 ||
            !digestPattern.test(reference.slice(prefix.length))) throw provenanceFailure();
      }
    }
    const statuses = revision.status.containerStatuses.map(row => ({ name: row.name, image: row.imageDigest }));
    if (revision.status.imageDigest !== undefined && revision.status.imageDigest !== platformImages[kind]) throw provenanceFailure();
    for (const [rows, references] of [[snapshot.images, images], [after.images, platformImages], [statuses, platformImages]]) {
      if (rows.length !== Object.keys(expected).length || new Set(rows.map(row => row.name)).size !== rows.length ||
          rows.some(row => !Object.hasOwn(expected, row.name) ||
            typeof references[expected[row.name]] !== 'string' || row.image !== references[expected[row.name]])) throw provenanceFailure();
    }
    return after; // Keep actual serving image references in revision/rollback evidence.
  } catch {
    throw provenanceFailure();
  }
}
export function checkInvoker(policy, kind) {
  const members = policy.bindings?.filter(binding => binding.role === 'roles/run.invoker').flatMap(binding => binding.members ?? []) ?? [];
  if (kind === 'backend' && (members.includes('allUsers') || members.includes('allAuthenticatedUsers') ||
      !members.includes('serviceAccount:' + serviceAccount('frontend')))) throw new Error('Backend IAM policy is not the approved private policy.');
  if (kind === 'frontend' && !members.includes('allUsers')) throw new Error('Frontend is not publicly invokable.');
}

export async function smoke(expectedSha, request = fetch) {
  const check = async (url, expected, version = false) => {
    const response = await request(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: { 'Cache-Control': 'no-cache' } });
    if (response.status !== expected) throw new Error('Smoke check failed: expected HTTP ' + expected + ' from ' + new URL(url).pathname);
    if (version && (await response.json()).releaseSha !== expectedSha) throw new Error('Running source SHA does not match the release.');
  };
  await check(settings.frontend + '/', 200);
  await check(settings.frontend + '/api/health', 200);
  await check(settings.backend + '/api/health', 403);
  await check(settings.frontend + '/_backend_identity', 404);
  await check(settings.frontend + '/version.json', 200, true);
  await check(settings.frontend + '/api/version', 200, true);
}

export async function main(mode, env = process.env) {
  const context = releaseContext(env);
  if (!['build', 'publish', 'deploy'].includes(mode)) throw new Error('Choose build, publish or deploy.');
  if (env.GITHUB_ACTIONS !== 'true') throw new Error('Execution is limited to the approved GitHub workflow; local tests use pure functions.');
  if (command('git', ['rev-parse', 'HEAD']) !== context.sha) throw new Error('Checkout does not match released SHA.');
  if (command('git', ['status', '--porcelain'])) throw new Error('The release checkout must contain no changed or untracked source.');
  // This metadata-only release must never silently introduce a migration.
  if (command('git', ['diff', '--name-only', settings.schemaBase, 'HEAD', '--', 'server/prisma/schema.prisma', 'server/prisma/migrations'])) {
    throw new Error('Schema changes need a separate reviewed migration plan.');
  }
  if (mode === 'build') {
    for (const item of targets) {
      command('docker', ['build', '--platform=linux/amd64', '--file=' + item.context + '/Dockerfile',
        '--target=' + item.target, '--build-arg=RELEASE_SHA=' + context.sha,
        '--label=org.opencontainers.image.revision=' + context.sha,
        '--tag=' + settings.registry + '/' + item.name + ':' + context.tag, item.context]);
    }
    save('built.json', { ...context, built: targets.map(item => item.name) });
    console.log('Built four local images from the released commit; no uploads or deployment.');
    return;
  }
  if (!env.CLOUDSDK_AUTH_ACCESS_TOKEN) throw new Error('Missing short-lived deployment authentication.');
  assertCurrentMain(context.sha);
  if (mode === 'publish') {
    const built = load('built.json');
    if (built.sha !== context.sha || built.tag !== context.tag) throw new Error('Local build provenance is missing.');
    command('docker', ['login', '--username=oauth2accesstoken', '--password-stdin', 'asia-southeast1-docker.pkg.dev'],
      { input: env.CLOUDSDK_AUTH_ACCESS_TOKEN + '\n' });
    const images = {};
    for (const { name } of targets) {
      images[name] = publishImage(name, context);
      save('images.json', { sha: context.sha, tag: context.tag, images });
      console.log(name + ': ' + images[name]);
    }
    save('images.json', { sha: context.sha, tag: context.tag, images });
    return;
  }
  const images = verifiedImages(load('images.json'), context);
  // Resolve all application containers before changing either service. Each child
  // is fetched from the exact approved package and bound to its parent by hash.
  const readRegistry = registryReader(env);
  const platformImages = Object.fromEntries(['backend', 'frontend', 'token-helper']
    .map(name => [name, resolvePlatformImage(name, images[name], readRegistry)]));
  const before = {};
  for (const kind of ['backend', 'frontend']) {
    const service = JSON.parse(cloud(['run', 'services', 'describe', 'workflow-' + kind, '--format=json']));
    assertServiceConfiguration(service, kind, images, context);
    const snapshot = serviceSnapshot(service, kind);
    const revision = JSON.parse(cloud(['run', 'revisions', 'describe', snapshot.revision, '--format=json']));
    before[kind] = readyRevision(revision, snapshot, kind);
    checkInvoker(JSON.parse(cloud(['run', 'services', 'get-iam-policy', 'workflow-' + kind, '--format=json'])), kind);
  }
  const progress = { sha: context.sha, before, attempted: [], completed: [] };
  save('rollback.json', progress);
  for (const kind of ['backend', 'frontend']) {
    const file = path.join(outputDirectory, kind + '.yaml');
    guardedReplacement(kind, images, context, before[kind], {
      describe: () => JSON.parse(cloud(['run', 'services', 'describe', 'workflow-' + kind, '--format=json'])),
      stage: service => { writeFileSync(file, stringify(service)); return file; },
      replace: staged => {
        progress.attempted.push(kind);
        save('rollback.json', progress);
        return cloud(['run', 'services', 'replace', staged]);
      },
    });
    const service = JSON.parse(cloud(['run', 'services', 'describe', 'workflow-' + kind, '--format=json']));
    const snapshot = serviceSnapshot(service, kind);
    const revision = JSON.parse(cloud(['run', 'revisions', 'describe', snapshot.revision, '--format=json']));
    const after = verifiedRevision(service, revision, kind, images, platformImages, context);
    checkInvoker(JSON.parse(cloud(['run', 'services', 'get-iam-policy', 'workflow-' + kind, '--format=json'])), kind);
    save(kind + '-revision.json', { sha: context.sha, ...after });
    progress.completed.push(kind);
    save('rollback.json', progress);
  }
  await smoke(context.sha);
  save('verification.json', { sha: context.sha, status: 'passed', checks: ['200', '200', '403', '404', 'frontend SHA', 'backend SHA'] });
  console.log('PASS: main release, immutable images, private-backend HTTP checks and both running versions.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
}
