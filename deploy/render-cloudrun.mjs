import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { canonicalAudience } from './token-helper/dist/config.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(directory, '..');
const registry = 'asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/';
const fields = {
  frontend: { 'nginx-image': 'NGINX_IMAGE', 'helper-image': 'HELPER_IMAGE', 'backend-url': 'BACKEND_URL', 'service-account': 'SERVICE_ACCOUNT' },
  backend: { 'backend-image': 'BACKEND_IMAGE', 'service-account': 'SERVICE_ACCOUNT', 'reviewer-email': 'REVIEWER_EMAIL',
    'runtime-db-version': 'RUNTIME_DB_VERSION', 'jwt-version': 'JWT_VERSION' },
};

export function renderService(kind, values) {
  if (!Object.hasOwn(fields, kind)) throw new Error('Choose frontend or backend.');
  const replacements = {};
  for (const [option, field] of Object.entries(fields[kind])) {
    const value = values[option];
    if (typeof value !== 'string' || !value || /[\r\n]/.test(value)) throw new Error(`Missing or invalid ${option}.`);
    if (option.endsWith('-image') && (!value.startsWith(registry) || !/^[-a-zA-Z0-9./]+@sha256:[a-f0-9]{64}$/.test(value))) {
      throw new Error('Use an immutable image digest from the approved registry.');
    }
    if (option === 'service-account' && !/^workflow-(frontend|backend)@cpe334-workflow-approval-2026\.iam\.gserviceaccount\.com$/.test(value)) {
      throw new Error('Invalid application service account.');
    }
    if (option === 'service-account' && value !== `workflow-${kind}@cpe334-workflow-approval-2026.iam.gserviceaccount.com`) {
      throw new Error('Service account does not match the service.');
    }
    if (option.endsWith('-version') && !/^[1-9]\d*$/.test(value)) throw new Error('Pin a numeric secret version.');
    if (option === 'reviewer-email' && (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(value) || value !== value.trim().toLowerCase())) {
      throw new Error('Use a normalized reviewer email.');
    }
    replacements[field] = option === 'backend-url' ? canonicalAudience(value) : value;
  }
  const template = readFileSync(path.join(directory, 'cloudrun', `${kind}.template.yaml`), 'utf8');
  return template.replace(/\$\{([A-Z_]+)\}/g, (_match, field) => {
    if (!(field in replacements)) throw new Error('Unresolved template setting.');
    // JSON strings are valid YAML strings; settings cannot inject new YAML fields.
    return JSON.stringify(replacements[field]);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = Object.fromEntries([...new Set(Object.values(fields).flatMap(value => Object.keys(value))), 'out'].map(name => [name, { type: 'string' }]));
    const { values, positionals } = parseArgs({ options, allowPositionals: true });
    const result = renderService(positionals[0], values);
    if (!values.out) throw new Error('An output file inside .local is required.');
    const output = path.resolve(workspace, values.out);
    const localRoot = path.join(workspace, '.local') + path.sep;
    if (!output.startsWith(localRoot)) throw new Error('Output must stay inside .local.');
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, result);
    console.log('Rendered local Cloud Run configuration. No cloud operations performed.');
  } catch {
    console.error('Configuration rendering failed. Check required non-secret inputs, pinned digests/versions, and output path.');
    process.exitCode = 1;
  }
}
