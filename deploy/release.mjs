import { spawnSync } from 'node:child_process';
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

function command(binary, args, { input, allowMissing = false } = {}) {
  const result = spawnSync(binary, args, { cwd: workspace, encoding: 'utf8', input, windowsHide: true });
  if (result.error || result.status !== 0) {
    if (allowMissing && /NOT_FOUND/.test(result.stderr ?? '')) return null;
    // Never echo child stdout/stderr: authentication errors can contain token material.
    throw new Error(binary + ' ' + args.slice(0, 3).join(' ') + ' failed (exit ' + result.status + '). No later operations executed.');
  }
  return result.stdout.trim();
}
const cloudArgs = ['--project=' + settings.project, '--region=' + settings.region, '--quiet'];
function cloud(args, options) { return command('gcloud', [...args, ...cloudArgs], options); }
function artifact(args, options) {
  return command('gcloud', ['artifacts', 'docker', ...args, '--project=' + settings.project, '--quiet'], options);
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
      const tag = settings.registry + '/' + name + ':' + context.tag;
      if (artifact(['images', 'describe', tag, '--format=value(image_summary.digest)'], { allowMissing: true }) !== null) {
        throw new Error('Refusing to overwrite an existing run tag.');
      }
      assertCurrentMain(context.sha);
      command('docker', ['push', tag]);
      const digest = artifact(['images', 'describe', tag, '--format=value(image_summary.digest)']);
      if (!digestPattern.test(digest)) throw new Error('Registry did not return a valid digest.');
      images[name] = settings.registry + '/' + name + '@' + digest;
      save('images.json', { sha: context.sha, tag: context.tag, images });
      console.log(name + ': ' + images[name]);
    }
    save('images.json', { sha: context.sha, tag: context.tag, images });
    return;
  }
  const images = verifiedImages(load('images.json'), context);
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
    const after = readyRevision(revision, snapshot, kind);
    const actualImages = new Map(after.images.map(row => [row.name, row.image]));
    const expected = kind === 'backend' ? { backend: images.backend } : { nginx: images.frontend, 'token-helper': images['token-helper'] };
    if (Object.entries(expected).some(([name, image]) => actualImages.get(name) !== image) ||
        revision.metadata.labels?.['release-sha'] !== context.sha) throw new Error('Ready revision provenance mismatch; stop and inspect rollback.json.');
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
