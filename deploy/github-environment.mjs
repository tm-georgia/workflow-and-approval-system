import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const repository = 'tm-georgia/workflow-and-approval-system';
const environmentName = 'lab5-production';
const expectedReviewers = [186666746, 203077129];

export function validateEnvironment(environment, policies) {
  const rule = environment.protection_rules?.find(row => row.type === 'required_reviewers');
  const reviewers = rule?.reviewers ?? [];
  const ids = reviewers.filter(row => row.type === 'User').map(row => row.reviewer?.id).sort((a, b) => a - b);
  if (environment.name !== environmentName || rule?.prevent_self_review !== true ||
      reviewers.length !== 2 || JSON.stringify(ids) !== JSON.stringify(expectedReviewers)) {
    throw new Error('Production requires both named team reviewers as eligible approvers and self-review prevention.');
  }
  const policy = environment.deployment_branch_policy;
  if (policy?.protected_branches !== false || policy.custom_branch_policies !== true ||
      policies.total_count !== 1 || policies.branch_policies?.length !== 1 ||
      policies.branch_policies[0].name !== 'main' || policies.branch_policies[0].type !== 'branch') {
    throw new Error('Production deployment must allow only the main branch, with no tag/other-branch patterns.');
  }
  return true;
}

export async function verifyEnvironment(env = process.env, request = fetch) {
  if (env.GITHUB_REPOSITORY !== repository || env.GITHUB_REF !== 'refs/heads/main' || !env.GH_TOKEN) {
    throw new Error('Environment verification requires the authorized main workflow and read-only GitHub token.');
  }
  const root = 'https://api.github.com/repos/' + repository + '/environments/' + environmentName;
  const read = async url => {
    const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(30_000),
      headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + env.GH_TOKEN,
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'workflow-lab5-deployment-preflight' } });
    if (response.status !== 200) throw new Error('Production protection read-back failed: HTTP ' + response.status + '. No cloud authorization attempted.');
    return response.json();
  };
  validateEnvironment(await read(root), await read(root + '/deployment-branch-policies?per_page=100'));
  console.log('PASS: production environment requires a non-initiator team approval and permits only main.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyEnvironment().catch(() => { console.error('Production protection verification failed. Review environment settings and read permissions; no cloud authorization attempted.'); process.exitCode = 1; });
}
