import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEnvironment, verifyEnvironment, repository } from '../github-environment.mjs';

const environment = { name: 'lab5-production', protection_rules: [{ type: 'required_reviewers', prevent_self_review: true,
  reviewers: [{ type: 'User', reviewer: { id: 203077129 } }, { type: 'User', reviewer: { id: 186666746 } }] }],
  deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } };
const policies = { total_count: 1, branch_policies: [{ name: 'main', type: 'branch' }] };
test('the documented two-member production gate is valid without trusting a YAML environment name', () => {
  assert.equal(validateEnvironment(environment, policies), true);
});
test('missing review rules, self-review, missing teammate or broad branch/tag access fail closed', () => {
  for (const value of [{ ...environment, protection_rules: [] },
    { ...environment, protection_rules: [{ ...environment.protection_rules[0], prevent_self_review: false }] },
    { ...environment, protection_rules: [{ ...environment.protection_rules[0], reviewers: environment.protection_rules[0].reviewers.slice(0, 1) }] },
    { ...environment, deployment_branch_policy: null }]) assert.throws(() => validateEnvironment(value, policies));
  for (const value of [{ total_count: 0, branch_policies: [] },
    { total_count: 1, branch_policies: [{ name: '*', type: 'branch' }] },
    { total_count: 1, branch_policies: [{ name: 'main', type: 'tag' }] }]) assert.throws(() => validateEnvironment(environment, value));
});
test('HTTP failures and non-main invocation stop before cloud authentication without exposing the token', async () => {
  let called = false;
  const noRead = async () => { called = true; throw new Error('must not request'); };
  await assert.rejects(verifyEnvironment({ GITHUB_REPOSITORY: repository, GITHUB_REF: 'refs/heads/feature', GH_TOKEN: 'synthetic-github-token' }, noRead));
  assert.equal(called, false);
  await assert.rejects(verifyEnvironment({ GITHUB_REPOSITORY: repository, GITHUB_REF: 'refs/heads/main', GH_TOKEN: 'synthetic-github-token' },
    async () => ({ status: 404 })), /HTTP 404/);
});
