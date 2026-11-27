# Lab 5 Issue 6 (#27): GCP Access and Merge Gate

Original evidence snapshot: **22 November 2026**; completion/tracking refreshed **24 November 2026**. The official handout Sections 4.1, 4.4, 5, 7-9 and 12 govern Issue 6's R-06/C-02 results and shared R-09/R-10 obligations. [Final tracking and qualifications](deployment.md#11-final-github-tracking-and-qualifications) supersede preparation-only status statements; historical runs, commands, screenshots and review bodies remain unchanged.

This record separates verified configuration, completed CI and authentication results, and remaining submission evidence. GCP configuration results below come from the preceding authorized read-back verification. Final GitHub rulesets, effective branch rules, Issue #27 metadata, actual review comments and historical CI metadata were read back for this update; no authentication run, CI demonstration or GCP configuration operation was repeated. Screenshot originals were inspected without modification.

## 1. Status and scope

| Item | Status and evidence scope |
|---|---|
| GCP WIF configuration | **PASS:** all nine configuration read-back checks passed; this is configuration evidence, not a live GitHub authentication result. |
| Authentication workflow implementation | **PASS:** [PR #28](https://github.com/tm-georgia/workflow-and-approval-system/pull/28) merged into `sprint-staging`; all three ordinary CI checks passed. |
| Main and staging merge gates | **PASS:** both rulesets remain active/effective with zero bypass actors. Both main and staging require all three CI checks, as detailed in Section 4. |
| R-06 / C-02 | **PASS, historical demonstration:** the intentional client assertion failed, GitHub marked that check required, and the open non-draft PR showed an explicit failed-required-check merge blocker. See Figures 6.1-6.2. |
| Repository Actions variables | **PASS:** all three repository variables were read back and exactly match Section 3. They are non-secret identifiers. |
| Release into `main` | **PASS:** [PR #30](https://github.com/tm-georgia/workflow-and-approval-system/pull/30) merged into `main` at `ef521b600b3548449487df7eeda5f5cea076c4a1`, with teammate approval and all three CI checks passing. The substantive-comment limitation remains below. |
| Live GitHub-to-GCP authentication | **PASS:** [run 44987606342](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44987606342), one manual execution from `main` at the release commit. OIDC exchange and service-account impersonation succeeded. |
| R-09 substantive review evidence | **QUALIFIED:** #28's approval is generic and #30's approval body is empty. [PR #31's specific review](https://github.com/tm-georgia/workflow-and-approval-system/pull/31#pullrequestreview-6010697350) preceded its merge; this resolves #31's preparation-stage missing-review status, not the original #28/#30 limitation. |
| Issue state | [Issue #27](https://github.com/tm-georgia/workflow-and-approval-system/issues/27) is **CLOSED** and labelled `lab5`. The completion comment records earlier board confirmation; current board status remains **UNVERIFIED** because this token lacks `read:project`. |

Historical PR #31 preparation branch: `docs/lab5-issue-6-evidence`, created from `origin/sprint-staging` at `ff8bf017d170dac5b9bdaa84ba14c876f5324ecb`; an authorized fetch of `main` and `sprint-staging` confirmed that the latest staging tip still matches that base, so no rebase or merge was needed. At the original PR #31 preparation checkpoint, remote `main` was `ef521b600b3548449487df7eeda5f5cea076c4a1`. The temporary failing-test branch remains at `a41dfcd4fb9643ca5273a41ad441216071f4e7df`. The then-open [documentation PR #31](https://github.com/tm-georgia/workflow-and-approval-system/pull/31) targets `sprint-staging`, is non-draft, labeled `lab5`, references `Refs #27` and requests reviewer `tm-georgia`. That preparation correction updated only documentation and its verification record on the original branch; it did not require a duplicate PR. That preparation session did not merge the PR, close Issue #27, rerun demonstrations or modify settings, IAM or GCP resources.

Worktree isolation was verified before editing: this existing root worktree is on `docs/lab5-issue-6-evidence`; Issue 7 is on `feature/lab5-issue-7-8-cd` in the separate `.local/worktrees/lab5-issue-7-8` worktree. No Issue 7 branch, index or files were changed. Before synchronization, the two documentation files and all eight screenshot originals were backed up under ignored `.local/issue6-finalization/before`; their original SHA-256 values were retained. No stash, reset, clean, checkout or local-file removal was needed.

### 1.1 Handout requirements and issue boundaries

The official handout's Section 7 identifies Issue 6 as "Connect GitHub to GCP and set the merge gate", done when a failing temporary-branch PR cannot merge. Section 8 requires the file/test name, command or CI run, result and tested commit. Section 12 requires evidence of main's required-check setting and the historical blocked merge; screenshots are used only when a link cannot show the fact on its own.

| Owner / requirement | Audit result and boundary |
|---|---|
| **Issue 6: authentication, R-06 / C-02** | **PASS:** existing live authentication and the historical failed-required-check blocker are complete. No new authentication, deployment or failing-CI demonstration is needed. |
| **Issue 6 / shared R-05 and C-01** | **PASS:** normal PR CI builds/tests pass; both main and staging require all three checks. The historical PR #31 result is preserved in Section 5.3. |
| **Issue 6 / shared R-09 review** | **QUALIFIED:** #31 has a genuine specific pre-merge review; #28/#30 retain deficient original rationale. Preserve their actual records and obtain teacher acceptance of the historical limitation. |
| **Issue 6 / shared R-09 board** | **BLOCKED:** Issue #27's project-board membership cannot be established through this session's available access. This is unknown, not proof of absence. |
| **Issue 6 / shared R-10, R-12** | **PASS within the audited scope:** Lab 5 labels and historical artifacts are preserved; the repository is public. CI remains mandatory. |
| **Shared R-11** | Distinct implementation authorship and teammate approvals/gate participation record Issue 6 contributions. Both members must still be able to explain sampled work; an automated audit cannot establish that readiness. |
| **Issue 1 prerequisite: Section 4.4 / Step 1** | Original setup screenshots and partner confirmation support project access and the historical Editor grant. The personal-Gmail Free Trial/no-prepayment/no-Upgrade requirement remains unresolved; the existing screenshots show a paid account and no displayed credits. No IAM/billing change is proposed. |
| **Issue 7: R-07 / R-08 / C-06** | **Operational evidence PASS:** the later PR #39 release and run #5 establish the visible change, running commit and image provenance. PR #30 remains earlier history, not the C-06 deployment proof. Issue #32 is closed; R-09 remains qualified. |
| **Issue 8: R-04 / C-05** | Persistence across restart and redeploy belongs to Issue 8. Rollback/roll-forward is recommended, not a separate mandatory Issue 6 test. |
| **Final submission: Sections 4.3 / 12** | There are eight implementation issues. The handout's final report step is separate submission work, prepared manually in Google Docs with Answer Parts 0-4 and evidence-index rows. No additional GitHub issue or PDF is generated here. |
| **Recommended / optional** | Section 5 recommends WIF rather than a JSON key; the chosen WIF implementation has passed. Separate main/staging gate, WIF/IAM, variables and expanded-authentication screenshots are not individually mandated. Section 4.2 does not require a separate cloud staging environment. |

<a id="12-outstanding-issue-1-human-access-prerequisites"></a>

### 1.2 Issue 1 evidence and unresolved access-method compliance

The original 22 November read-only audit used the existing university account and read active project `cpe334-workflow-approval-2026` and its IAM policy. The current cleanup reuses that record and the existing Issue #16 screenshots; it performs no new cloud inspection or change.

| Section 4.4 / Step 1 fact | Result and remaining evidence |
|---|---|
| One active shared project; current member can open it | **PASS:** project lifecycle is ACTIVE and the current human account can read it. |
| Both members can open the project | **Existing setup evidence:** the original Issue #16 comment confirms partner access; its screenshots show the shared project and historical human grants. This is preserved setup evidence, not a new sign-in or present-day access test. |
| Teammate added with the specified Editor role | **Historical setup evidence available:** the [original IAM screenshot](https://github.com/user-attachments/assets/b3e753d7-85eb-440f-9a0c-d5c08a37f31b) shows a personal-Gmail Owner and teammate Editor. This corrects the earlier claim that no literal Editor evidence existed. The later read-only policy snapshot had different Owner grants; neither historical view asserts today's IAM configuration, and no role is changed here. |
| Personal-Gmail Free Trial with USD 300 credit; no prepayment/Upgrade | **UNRESOLVED:** the existing [Credits screenshot](https://github.com/user-attachments/assets/950d78f5-b213-4895-9a3e-c1699c0267bf) says No credits to display and the [Overview screenshot](https://github.com/user-attachments/assets/19b6f577-383c-410b-9f01-bcf955d67441) says Paid account. They do not prove compliance. Obtain TA clarification/acceptance or valid existing evidence; spending approval is not a course exemption. |

[Issue #16's correction](https://github.com/tm-georgia/workflow-and-approval-system/issues/16#issuecomment-7135736097) leaves access-method compliance unchecked: **6/7 tasks** are complete. Its budget amount is **THB 50**, as shown by the [existing amount screenshot](https://github.com/user-attachments/assets/e223ac0d-ef62-44f9-b078-bff8bf9c0a3b), correcting USD 50 in the original comment. Preserve the screenshots and the original statement alongside this correction. Do not create another project, sign up again, alter IAM/billing or infer payment history. The course-required access-method question belongs to the TA; cost alerts are recommended practice, not a hard cap.

## 2. Verified WIF configuration and permissions

| Setting | Verified value |
|---|---|
| Project ID / number | `cpe334-workflow-approval-2026` / `597719179612` |
| Application region | `asia-southeast1`; WIF resources use `global`. |
| GitHub repository | `tm-georgia/workflow-and-approval-system` |
| Immutable repository / owner IDs | `1448556407` / `186666746` |
| Authentication service account | `workflow-github-auth@cpe334-workflow-approval-2026.iam.gserviceaccount.com`, enabled |
| Pool | `projects/597719179612/locations/global/workloadIdentityPools/github-actions`, ACTIVE |
| Provider | `projects/597719179612/locations/global/workloadIdentityPools/github-actions/providers/github-auth`, ACTIVE |
| OIDC issuer | `https://token.actions.githubusercontent.com` |
| Required enabled APIs | `iam.googleapis.com`, `iamcredentials.googleapis.com`, `sts.googleapis.com`, `cloudresourcemanager.googleapis.com` |

All six mappings were read back successfully:

```text
google.subject = assertion.sub
attribute.repository_id = assertion.repository_id
attribute.repository_owner_id = assertion.repository_owner_id
attribute.ref = assertion.ref
attribute.event_name = assertion.event_name
attribute.workflow_ref = assertion.workflow_ref
```

All five provider conditions must hold:

```text
attribute.repository_id == '1448556407' &&
attribute.repository_owner_id == '186666746' &&
attribute.ref == 'refs/heads/main' &&
attribute.event_name == 'workflow_dispatch' &&
attribute.workflow_ref == 'tm-georgia/workflow-and-approval-system/.github/workflows/gcp-auth-check.yml@refs/heads/main'
```

Default provider audience validation remains enabled, with no explicit audience override. The WIF provider audience is separate from the Cloud Run backend audience used by the existing frontend token helper.

The authentication service account has exactly one incoming IAM binding: **`roles/iam.workloadIdentityUser` on this service account**, for this principal:

```text
principalSet://iam.googleapis.com/projects/597719179612/locations/global/workloadIdentityPools/github-actions/attribute.workflow_ref/tm-georgia/workflow-and-approval-system/.github/workflows/gcp-auth-check.yml@refs/heads/main
```

Read-back found **zero direct project-level role grants** to this account and **zero user-managed keys**. No service-account JSON key was created or retrieved. This statement is scoped to the checks performed; it is not an exhaustive assertion about every inherited or public-resource permission. Issue 6 granted no deployment, database or production-secret access. Existing frontend/backend/operations identities and human roles were not modified by the WIF setup.

Authentication-only verification stays separate from Issue 7 deployment authorization. A future deployment identity and its resource-scoped permissions require a separately reviewed plan; the authentication account must not silently gain deployment roles.

## 3. Workflow implementation and verified variables

Source: [authentication workflow](../../../.github/workflows/gcp-auth-check.yml), introduced by commit [`606454da6fbf617ca694ec9036f612102d4cf312`](https://github.com/tm-georgia/workflow-and-approval-system/commit/606454da6fbf617ca694ec9036f612102d4cf312).

- Name: `GCP Authentication Check`; trigger: `workflow_dispatch` only.
- Job guard: `github.ref == 'refs/heads/main'`. Ordinary PR CI does not authenticate to GCP.
- Default permissions: empty; authentication job: only `id-token: write`. No checkout or repository-content permission is needed for this token-only check.
- Official authentication action pinned to `google-github-actions/auth@7c6bc770dae815cd3e89ee6cdf493a5fab2cc093` (verified v3 commit).
- Requests an access token with a 300-second lifetime; `create_credentials_file: false` and `export_environment_variables: false`.
- The final step tests only whether an access-token output exists and prints a fixed success message. It does not print the token, store credentials as artifacts, deploy, or call production-resource APIs.

Local implementation validation passed: YAML parsing/duplicate-key checks, checksum-verified actionlint v1.7.12 syntax/expression validation, official action input/source inspection, permission/WIF compatibility checks, and Git whitespace checks. Those validations were not rerun as live authentication during documentation preparation.

The following **non-secret repository Actions variables** were read back successfully and exactly match the approved configuration:

| Variable | Verified value | Verification |
|---|---|---|
| `GCP_PROJECT_ID` | `cpe334-workflow-approval-2026` | PASS: exact match |
| `GCP_AUTH_SERVICE_ACCOUNT` | `workflow-github-auth@cpe334-workflow-approval-2026.iam.gserviceaccount.com` | PASS: exact match |
| `GCP_WIF_PROVIDER` | `projects/597719179612/locations/global/workloadIdentityPools/github-actions/providers/github-auth` | PASS: exact match |

No GitHub secret is required for these identifiers. The workflow is now present on `main`; its Git blob `268153630b8f91fadcb863dba12c6109db8cad99` exactly matches the approved implementation. See the [released workflow](https://github.com/tm-georgia/workflow-and-approval-system/blob/ef521b600b3548449487df7eeda5f5cea076c4a1/.github/workflows/gcp-auth-check.yml) and the completed authentication result in Section 5.2. Do not dispatch it again merely to collect documentation.

## 4. Verified main and sprint-staging quality gates

| Setting | Main quality gate | Staging quality gate |
|---|---|---|
| Ruleset | [27825087: Lab 5 - Main Quality Gate](https://github.com/tm-georgia/workflow-and-approval-system/rules/27825087) | [27825271: Lab 5 - Staging Quality Gate](https://github.com/tm-georgia/workflow-and-approval-system/rules/27825271) |
| Enforcement / effective branch protection | ACTIVE / verified effective | ACTIVE / verified effective |
| Target | `~DEFAULT_BRANCH`, currently `main` | `refs/heads/sprint-staging` |
| Exclusions / bypass actors | None / 0 | None / 0 |
| Approving reviews required | 1 | 1 |
| Dismiss stale approvals | Enabled | Enabled |
| Resolve review conversations | Required | Required |
| Branch up to date before merge | Required | Required |
| Restricted deletions / blocked force pushes | Enabled / enabled | Enabled / enabled |
| Required checks | `Client Tests and Build`; `Server Tests and Build`; `Private Backend Proxy Checks` | `Client Tests and Build`; `Server Tests and Build`; `Private Backend Proxy Checks` |
| Code-owner review / last-push approval | Disabled / disabled | Disabled / disabled |
| Extra approval for unattributed changes | Required | Required |
| Allowed merge methods | Merge, squash, rebase | Merge, squash, rebase |

The required checks are bound to GitHub Actions integration ID `15368`. Current effective rules and ACTIVE enforcement were read back again for both branches. GraphQL confirms zero bypass actors on both rulesets. The main selector follows the default branch if that default changes.

**Final gate parity verified:** the teammate saved `Private Backend Proxy Checks` on the main ruleset, whose API `updated_at` is **22 November 2026, 12:23:24.162 Bangkok time**. This session independently read back all three required checks on both the saved rulesets and effective rules for `main` and `sprint-staging`. All retained protections in the table remain enabled; GraphQL verifies zero bypass actors. Both rulesets enforce required checks on branch creation as well. The earlier two-check main configuration was historical; PR #30 passing the proxy check alone was not proof that it was required then. The historical client-failure demonstration remains valid. This session changed no settings.

The [final verification snapshot](evidence/issue06-final-verification.json) preserves the read-only API sources, final gate settings, branch SHAs, actual review bodies, issue-label result, project-access limitation and screenshot hashes. The latest read-only audit also opened the public main ruleset page and its API without authentication: both returned HTTP 200 and contained all three required check names. The [public Main Quality Gate](https://github.com/tm-georgia/workflow-and-approval-system/rules/27825087) therefore supplies the Section 12 required-setting evidence. A separate main-gate screenshot is optional, not a mandatory missing item. The existing historical blocked-merge screenshot remains necessary because the now-closed PR link cannot reproduce its earlier open/blocked state.

## 5. PR #28: implementation, review, merge and passing CI

| Artifact | Verified record |
|---|---|
| Implementation PR | [#28: Add keyless GCP authentication verification](https://github.com/tm-georgia/workflow-and-approval-system/pull/28), labelled `lab5` |
| Feature commit | `606454da6fbf617ca694ec9036f612102d4cf312`; one new workflow file |
| Merge | Into `sprint-staging`, commit `ff8bf017d170dac5b9bdaa84ba14c876f5324ecb`; 22 November 2026, 11:04:49 Bangkok time |
| CI | [Run 44980098231](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44980098231), completed successfully |
| Check results | `Client Tests and Build`: PASS; `Server Tests and Build`: PASS; `Private Backend Proxy Checks`: PASS |
| Teammate review | [Approval by tm-georgia](https://github.com/tm-georgia/workflow-and-approval-system/pull/28#pullrequestreview-6010230789) on the feature commit, distinct from author `thit3455` |

**R-09 limitation:** the approval comment is exactly, "Your work looks pretty fine." It confirms an approval was submitted, but does not identify a specific check, question, finding or reason. No inline review comments were found during the review audit. Do not describe this as substantive technical-review evidence. Future reviews must state actual checks/findings; no reviewer statement or historical review has been invented or rewritten here.

PR #28 was the staging implementation step. PR #30 subsequently released the workflow to main, as recorded below. Its merge and later authentication success do not retroactively improve PR #28's review comment.

### 5.1 PR #30: completed release to main

| Artifact | Verified record |
|---|---|
| Release PR | [#30: First Deployment and GCP Authentication Setup](https://github.com/tm-georgia/workflow-and-approval-system/pull/30), `main` <- `sprint-staging`, labeled `lab5`, references `Refs #25` and `Refs #27` |
| Reviewed base / head | `d75786edad306ef02b911c2ee572db35052623b0` / `ff8bf017d170dac5b9bdaa84ba14c876f5324ecb` |
| Scope | Six commits, 35 files, 2,516 additions and 27 deletions: Issue 5 authenticated proxy, token helper, Cloud Run templates, operations-image security fixes, provisioning, tests, documentation and four earlier screenshots, plus the Issue 6 authentication workflow |
| Merge | By `tm-georgia` into `main` at `ef521b600b3548449487df7eeda5f5cea076c4a1`, 22 November 2026 at 11:58:42 Bangkok time |
| CI | [Run 44986998293](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44986998293), release head `ff8bf017d170dac5b9bdaa84ba14c876f5324ecb`: all three client, server and private-proxy checks PASS |
| Approval | [tm-georgia's approval](https://github.com/tm-georgia/workflow-and-approval-system/pull/30#pullrequestreview-6010469461), 11:58:31 Bangkok time, on the reviewed head |
| Exclusions | The deliberate failing test from PR #29 was absent. This local Issue 6 record, its deployment-index additions and screenshots 07/08 were not included in PR #30. Screenshots 13/14 were supplied later. |

**R-09 still limited:** PR #30's approval body is empty. Current read-back of PRs #28 and #30 found no discussion or inline review comments supplying a specific check, finding, question or approval rationale. An approval and a successful merge are verified; substantive technical-review evidence is not. Do not invent a historical review. Any follow-up should record a genuine review or obtain the instructor's acceptance of the limitation.

**Deployment provenance remains unverified:** promoting reviewed source into main does not establish exact equivalence between that source and the previously deployed immutable images. Preserve [Issue 5's provenance limitation and credential-rotation follow-up](deployment.md#131-deployment-results-and-provenance). No deployment or credential rotation occurred during this release/authentication documentation work.

### 5.2 Completed live keyless authentication

| Artifact | Verified record |
|---|---|
| Run | [44987606342: GCP Authentication Check](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44987606342), completed SUCCESS |
| Trigger / ref / attempt | One approved `workflow_dispatch` by `thit3455` from `main`; attempt 1; created 22 November 2026 at 12:01:57 Bangkok time |
| Tested main commit | [`ef521b600b3548449487df7eeda5f5cea076c4a1`](https://github.com/tm-georgia/workflow-and-approval-system/commit/ef521b600b3548449487df7eeda5f5cea076c4a1) |
| Authentication job | [authenticate](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44987606342/job/137101499321): `Authenticate through WIF` and `Confirm authentication without displaying credentials` both succeeded |
| Authentication result | Google accepted GitHub OIDC federation and service-account impersonation for `workflow-github-auth@cpe334-workflow-approval-2026.iam.gserviceaccount.com`; the access-token presence check passed |
| Safe confirmation | The prior authorized log inspection found exactly `PASS: GitHub OIDC exchange and service-account impersonation.` No token value was displayed or saved in this record. |

The workflow requests a 300-second access token, creates no credential file and exports no credentials into the environment. The observed success proves this authentication path; it does not prove deployment permissions or access to Cloud Run, Cloud SQL or production secrets. No such resource calls were part of the workflow. Neither repository workflow has a `push` or PR `closed` trigger: merging PR #30 did not automatically authenticate or deploy. The successful manual run is completed evidence, not an instruction to rerun it.

### 5.3 Existing documentation PR #31

[PR #31](https://github.com/tm-georgia/workflow-and-approval-system/pull/31) is the existing non-draft documentation PR from `docs/lab5-issue-6-evidence` into `sprint-staging`, labeled `lab5`, referencing `Refs #27`, with reviewer `tm-georgia` requested. Its original documentation commit was `9201d9f3c39dd8ad34ded6b9822500455b9e5180`. [CI run 44990784980](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44990784980), attempt 1 on that commit, passed `Client Tests and Build`, `Server Tests and Build` and `Private Backend Proxy Checks`.

That result is preserved historical evidence, not a claim about CI on a later correction commit. The current correction uses this same PR; its new head and required-check results are visible on the PR. At correction preflight, #31 remained open/unmerged and had no review, inline comment or discussion comment. Passing documentation CI does not resolve R-09, establish human GCP prerequisites or prove deployment provenance.

## 6. PR #29: intentional failing-test demonstration (R-06 / C-02)

| Artifact | Verified record |
|---|---|
| Demonstration PR | [#29: C-02 failing-test demonstration - DO NOT MERGE](https://github.com/tm-georgia/workflow-and-approval-system/pull/29), non-draft, target `main`, labelled `lab5`, body `Refs #27` |
| Branch / head commit | `test/lab5-issue6-failing-ci` / `a41dfcd4fb9643ca5273a41ad441216071f4e7df` |
| Historical base | `d75786edad306ef02b911c2ee572db35052623b0`, matching remote `main` during the demonstration; current main has advanced through PR #30 |
| Change scope | Exactly one commit adding only `client/src/lab5-issue6-failing-ci.test.ts`; no production code, existing-test or workflow edits |
| CI run | [44984116918](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44984116918), completed with the expected FAILURE |
| Failed required check | [Client Tests and Build](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44984116918/job/137090826839) |
| Passing required check | [Server Tests and Build](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44984116918/job/137090827042) |
| Intended failure | `expect(1).toBe(2)`; `AssertionError: expected 1 to be 2`; file position `5:11` |
| Client test summary | 1 failed, 19 passed, 20 total; dependency installation succeeded and the subsequent client build was skipped |
| Actual CI checkout | Synthetic PR merge commit `e1a73c3303db41ef4ddd3d6b9a5552c099f699d5`; its tree was verified equal to the approved head tree. This was not a release or an actual merge into main. |

The focused local command previously produced the same intentional assertion failure:

```powershell
npm.cmd --prefix client test -- src/lab5-issue6-failing-ci.test.ts
```

This command is a historical record, not an instruction to rerun it during documentation work. CI subsequently ran the full client suite and confirmed exactly one deliberate failure.

While PR #29 was **open and non-draft**, GitHub reported `Client Tests and Build` with `isRequired: true`, `conclusion: FAILURE`, and PR `mergeStateStatus: BLOCKED`. Reviewer approval was also outstanding (`REVIEW_REQUIRED`). Figure 6.2 explicitly shows **"Required checks failing"** and **"1 required failing"**, so the captured evidence identifies the failed-check blocker, not merely missing approval or draft status. R-06 / C-02 is supported by the combined failed assertion, required-check configuration, API verification and open-PR screenshot.

**Current state differs from the screenshot:** PR #29 is **closed without merging** (22 November 2026, 11:23:36 Bangkok time). Its branch still exists remotely and locally at the same head. The screenshot records its earlier open/blocked state; current closure by itself is not proof of a CI gate. The failed run and original screenshots remain preserved; the intentional test is excluded from the release.

Historical correction checkpoint: Issue #27 was OPEN after a closure at 11:05:21 and reopening at 11:40:49 Bangkok time on 22 November 2026. The API then lacked `read:project`; browser attempts did not establish board membership, and that absence of verification was not proof of no membership. Issue #27 subsequently closed after reviewed PR #31 integration; its [completion comment](https://github.com/tm-georgia/workflow-and-approval-system/issues/27#issuecomment-7075263933) records board confirmation. Current board status is still not independently readable with this token. Preserve PR #29's branch, commit, failed run and historical screenshot; do not fix, merge or repeat its deliberate failing test.

## 7. Saved evidence, captions and gaps

All eight saved PNGs were visually inspected and checked for PNG integrity. Originals were not renamed, moved or modified; SHA-256 hashes were checked before and after the documentation changes. The four Issue 6 images below show no visible passwords, hashes, JWTs, access tokens, private keys or credential-bearing connection strings. Public repository/user names, branch names, commit SHAs and test assertions are not authentication secrets. The four earlier Issue 5 images retain the personal university-email/profile-information caveat in [the Issue 5 index](deployment.md#136-evidence-index-and-remaining-documentation-work); no visible authentication secrets were found in them either. These checks do not prove that previously exposed demonstration credentials have been rotated.

![C-02 intentional assertion failure and client test summary](evidence/07-c02-failed-test-summary.png)

**Figure 6.1 - C-02 / R-06:** [PR #29](https://github.com/tm-georgia/workflow-and-approval-system/pull/29), tested head `a41dfcd4fb9643ca5273a41ad441216071f4e7df`, [failed client job](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44984116918/job/137090826839) in run `44984116918`. The deliberate `expect(1).toBe(2)` assertion fails at `src/lab5-issue6-failing-ci.test.ts:5:11`; 1 test fails and 19 pass. The image is cropped and does not show the run URL or commit header, so retain this caption and direct links in the submission.

![C-02 open non-draft PR with explicit required-check merge blocker](evidence/08-c02-blocked-merge.png)

**Figure 6.2 - C-02 / R-06:** [PR #29](https://github.com/tm-georgia/workflow-and-approval-system/pull/29), target `main`, head `test/lab5-issue6-failing-ci` at `a41dfcd4fb9643ca5273a41ad441216071f4e7df`. Captured while open: **"Required checks failing"**, **"1 required failing"** and a disabled merge button; the title says **DO NOT MERGE** and `lab5` / `Refs #27` are visible. One approval is also outstanding. The browser URL and full SHA are not pictured; the caption supplies the verified artifact links and SHA. The PR is now closed unmerged, as recorded above.

![PR 30 merged release into main](evidence/13-release-pr-main.png)

**Figure 6.3 - Release traceability:** [PR #30](https://github.com/tm-georgia/workflow-and-approval-system/pull/30) shows Merged, `main` <- `sprint-staging`, merge abbreviation `ef521b6`, six commits, 35 changed files, the teammate's approval indicator, `lab5` and both issue references. The Checks tab shows a count of three, but the screenshot does not expand their results or show a substantive review comment. Pair it with [the passing CI run](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44986998293) and the review limitation in Section 5.1; the caption supplies the full merge SHA.

![Successful manual GCP authentication from main](evidence/14-gcp-authentication-success.png)

**Figure 6.4 - Live keyless authentication:** [run 44987606342](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44987606342) shows `GCP Authentication Check #1`, manual trigger, `main`, short commit `ef521b6`, overall Success and successful `authenticate` job. The screenshot does not show the expanded steps, fixed PASS message, full SHA or browser URL. Pair it with [job 137101499321](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44987606342/job/137101499321), full SHA `ef521b600b3548449487df7eeda5f5cea076c4a1` and the verified result in Section 5.2. No additional execution is needed; an expanded-step screenshot can be captured from this existing run if desired.

| Evidence ID | Requirement / artifact | Availability and limits |
|---|---|---|
| E6-01 | C-02 / R-06: intentional failure | **AVAILABLE:** [07-c02-failed-test-summary.png](evidence/07-c02-failed-test-summary.png), Figure 6.1; pair with the CI run/job link and head SHA. |
| E6-02 | C-02 / R-06: required check blocks merge | **AVAILABLE:** [08-c02-blocked-merge.png](evidence/08-c02-blocked-merge.png), Figure 6.2; historical open-PR state, not current closure. |
| E6-03 | Main required-check settings | **PASS:** the public ruleset URL in Section 4 was verified accessible without sign-in and shows all three checks. A separate `06-main-quality-gate.png` screenshot is optional and absent. |
| E6-04 | Staging quality-gate settings | **PASS settings:** verified ruleset link/settings and saved API evidence in Section 4. Optional proposed screenshot `09-sprint-staging-quality-gate.png` is absent. |
| E6-05 | GCP WIF pool/provider and scoped trust | **PASS recorded read-back and live authentication; optional screenshots absent:** proposed `10-wif-provider-trust.png` and `11-wif-service-account-iam.png`. Capture identifiers, mappings/conditions and IAM scope only, never token/key contents. |
| E6-06 | Passing CI and teammate review | **PASS CI/approval links:** PR #28/run `44980098231` and PR #30/run `44986998293`, review permalinks in Section 5. **MISSING substantive R-09 rationale.** |
| E6-07 | GitHub repository Actions variables | **PASS exact read-back:** Section 3. Optional supporting screenshot `12-github-actions-variables.png` is not saved. |
| E6-08 | Staging-to-main release | **AVAILABLE:** [13-release-pr-main.png](evidence/13-release-pr-main.png), Figure 6.3; PR #30 merged at `ef521b600b3548449487df7eeda5f5cea076c4a1`. Approval is verified; substantive-review evidence remains missing. |
| E6-09 | Live keyless authentication | **AVAILABLE:** [14-gcp-authentication-success.png](evidence/14-gcp-authentication-success.png), Figure 6.4; successful run `44987606342` at the release SHA. Step details are verified through the linked job and prior safe log inspection. |
| E6-10 | R-09 / R-10 traceability | Issue #27 is **CLOSED**, labelled `lab5`; PRs #28/#29/#30/#31 are labelled and their history remains available. Original #28/#30 review rationale remains qualified. Current board status needs an authorized member's confirmation. |
| E6-11 | Separate final report | The team will prepare the report manually in Google Docs, using the handout's Answer Parts and captions. This is not another implementation issue. No PDF is generated by this cleanup. |

Saved inventory: `01-cloud-run-services.png`, `02-migration-jobs.png`, `04-reviewer-dashboard.png`, `05-requester-approved.png`, `07-c02-failed-test-summary.png`, `08-c02-blocked-merge.png`, `13-release-pr-main.png`, and `14-gcp-authentication-success.png`. Suggested filenames 06 and 09-12 are absent and are not rendered as existing image links. Numbering gaps are not failures; the evidence coverage described above is what matters.

## 8. Remaining work and completion boundary

### Local review validation

At the original PR #31 preparation checkpoint, the review fetched `main` and `sprint-staging`; staging remained at `ff8bf017d170dac5b9bdaa84ba14c876f5324ecb`, already the documentation branch's base. No synchronization changes or conflict resolution were needed. The existing local Markdown and all eight screenshot originals were backed up before editing. The initial commit selected the two Issue 6 documentation paths, four supplied Issue 6 PNGs and the verification JSON. The current correction changes only the two Markdown documents and the verification JSON; every screenshot remains unchanged. Application, CI, deployment configuration and Issue 7 files are outside the change.

Initial PR #31 validation passed for all 31 relative documentation links/anchors, preservation of every prior linked URL and full 40-character commit/blob SHA, all eight PNG signatures/chunk CRCs/compressed image streams and original SHA-256 hashes, whitespace and credential patterns in the changed documentation and evidence. All eight PNGs were visually reinspected: the Issue 6 captions match their visible content and no visible authentication secrets were found. Historical CI run/job metadata, source links, variables, issue label, rulesets and actual review bodies were read back without rerunning jobs. Project-board membership remains unverified for the access reasons above. Screenshot settings gaps and the earlier Issue 5 personal-profile caveat remain explicit.

The existing documentation PR uses base `sprint-staging`, head `docs/lab5-issue-6-evidence`, title **Lab 5 Issue 6: Final GCP Authentication and Merge Gate Evidence**, label `lab5`, reference `Refs #27` and reviewer `tm-georgia`. Its head-specific three-check CI result and documentation commit SHA are available on the PR and in the final handoff; historical runs in Sections 5-6 remain separate evidence. Correction validation checks relative links/anchors, JSON consistency, preservation of historical URLs/SHAs/results and all screenshot hashes, whitespace, credential patterns and the three-file scope. Passing CI does not supply teammate approval or resolve R-09.

### Remaining Issue 6 workflow requirements

1. **Completed:** PR #31 obtained a [specific pre-merge teammate review](https://github.com/tm-georgia/workflow-and-approval-system/pull/31#pullrequestreview-6010697350), all three checks passed and it merged at `2da93cc2583628b4e1009b42db60b7c228fafb60`. Preserve #28's generic approval and #30's empty approval; teacher acceptance remains needed for those original rationale gaps.
2. **Manual confirmation:** an authorized project maintainer must confirm Issue #27's membership and completed Status on the Lab 5 board. The current token cannot read or update Projects; do not broaden permissions or guess its state.
3. **Completed integration:** Issue #27 is closed and PR #31 is merged. Existing successful-authentication and C-02 screenshots remain supporting evidence. The final report is prepared separately; no repeat authentication, cloud setup or new WIF screenshot is required.

### Other issues and shared safety follow-ups

- **Issue 1:** historical project/access/Editor and budget evidence is now linked above; Free Trial compliance remains unresolved and one checkbox remains open. Obtain TA clarification/acceptance without changing resources.
- **Issue 7:** R-07/R-08 and C-06 operational evidence passed for released SHA `44a3fdaf0e3e056bc717f64c78c18a9cea53bc05`; Issue #32 is closed. Its original/retrospective R-09 distinction remains qualified. Exact equivalence of the first Issue 5 images is a separate historical limitation.
- **Issue 8:** R-04/C-05 passed for Request 2's nine selected fields; PR #42 merged and Issue #41 closed with 10/10 tasks complete. Its actual baseline -> redeployment -> controlled-replacement chronology is preserved in the [persistence runbook](issue08-persistence.md).
- **Final report:** the team will prepare the submission separately in Google Docs using the existing evidence. No additional implementation issue or generated PDF is part of this cleanup.
- **Historical Issue 5 security follow-up:** the original exposure/rotation requirement in [deployment.md](deployment.md#134-completed-security-architecture-and-iam) was completed through the separately approved maintenance stages before later demonstrations. The Issue 7 release procedure records that bootstrap/session handling as completed; it must not be repeated for documentation. This cleanup accesses no credentials and invents neither an exposure channel nor a claim that credentials were pushed to GitHub.

### Optional supporting screenshots

- Main-gate screenshot `06-main-quality-gate.png` is optional because the verified public ruleset link already shows the required setting. The historical `08-c02-blocked-merge.png` remains the necessary visual record of the now-unavailable open-PR blocker.
- Staging/WIF/service-account screenshots using suggested names `09-sprint-staging-quality-gate.png`, `10-wif-provider-trust.png` and `11-wif-service-account-iam.png` are optional supporting views. Their absence does not invalidate the verified configuration or authentication results.
- `12-github-actions-variables.png` and an expanded-step view from existing run `44987606342` are also optional; API/job links already support those recorded facts. Never expose tokens or rerun the workflow for screenshots.
- A separate submission copy may omit unnecessary personal email/profile identifiers from the older Issue 5 images while preserving the originals.

**Issue 6 authentication, R-06 and C-02 passed; documentation integration and closure are complete.** PR #31's specific pre-merge review is verified. Original #28/#30 rationale and current board visibility remain qualified/unverified as stated; successful authentication is not unqualified acceptance of all Lab 5 history. Final tracking updates preserve every existing run and review and change no GCP configuration.
