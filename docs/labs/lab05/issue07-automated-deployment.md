# Lab 5 Issue 7 (#32): Automated Deployment and Release

Status as of **24 November 2026: PRODUCTION DEPLOYMENT AND DOCUMENTATION INTEGRATION COMPLETE; R-09 QUALIFIED**. Main release `44a3fdaf0e3e056bc717f64c78c18a9cea53bc05` and both jobs in Deploy Main Release #5 succeeded. Documentation PR #40 merged; Issue #32 is closed with 10/10 tasks complete. The deployment gate remains false. This factual cleanup preserves the implementation, original validation, IAM/WIF design, images and recovery procedure; it performs no new production verification.

Tracking: [Issue #32](https://github.com/tm-georgia/workflow-and-approval-system/issues/32) is **CLOSED**, assigned to **thit3455**, labelled **lab5**, with **10/10 tasks completed**. Its closure by thit3455 is recorded at 14:50:12 UTC on 24 November 2026. Earlier authenticated/public sidebar observations established In Progress membership in [@tm-georgia's project #5](https://github.com/users/tm-georgia/projects/5); those observations are historical, not proof of today's Done status. The token lacks project access, so an authorized maintainer must confirm/set Done. The six implementation/release PRs and documentation PR #40 remain labelled and preserved. Issue 8 verification has also completed; final report preparation is separate Google Docs work.

## Completed production execution

The following results are supported by the GitHub run/review APIs, the preserved original run artifact, the ten evidence files indexed in Section 6, the read-only public version/asset responses and the supplied completed-deployment record. No deployment, authentication demonstration, database write or infrastructure change was repeated during this documentation review.

| Item | Completed result |
|---|---|
| Final feature integration | [PR #38: OCI provenance correction](https://github.com/tm-georgia/workflow-and-approval-system/pull/38), merged into `sprint-staging`; merge `0b5c97751443108d077904c538704089d0c74b15` |
| Final release | [PR #39](https://github.com/tm-georgia/workflow-and-approval-system/pull/39), merged from `sprint-staging` into `main` by `thit3455`; approved by `tm-georgia` |
| Released main SHA | `44a3fdaf0e3e056bc717f64c78c18a9cea53bc05`, also the live main reference at this review |
| Deployment workflow | [Deploy Main Release #5, run 45314206420, attempt 1](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45314206420); `workflow_dispatch` from `main` |
| Validation and deployment | [Release validation: SUCCESS](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45314206420/job/138176994988); [Deploy approved main commit: SUCCESS](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45314206420/job/138178406278), not skipped |
| Approval separation | Initiator `tm-georgia`; independent environment approver `thit3455`; approval history records `lab5-production` |
| Protected environment | `lab5-production`; eligible reviewers `thit3455` and `tm-georgia`; self-review prevention enabled; administrator bypass disabled; only branch `main` allowed, verified read-only |
| GCP destination | Project `cpe334-workflow-approval-2026`, region `asia-southeast1`; existing Cloud Run services, Cloud SQL and Artifact Registry reused |
| Backend | `workflow-backend-00004-sck`, READY and receiving 100% traffic in the saved deployment evidence |
| Frontend | `workflow-frontend-00002-flx`, READY and receiving 100% traffic in the saved deployment evidence |
| Runtime secret references | `workflow-database-url:2` and `workflow-jwt-secret:1`; names/version metadata only, no payloads recorded |
| Running source | Frontend `/version.json` and proxied backend `/api/version` matched the full released main SHA in the successful automated verification |
| HTTP security verification | Frontend `/`: **200**; frontend `/api/health`: **200**; unauthenticated direct backend `/api/health`: **403**; frontend `/_backend_identity`: **404** |
| Verification record | [issue07-final-verification.json](evidence/issue07-final-verification.json): `status: passed`, correct SHA and six expected checks; identical to the original artifact's `verification.json` |
| Current deployment gate | `GCP_DEPLOY_ENABLED=false`, read back after the completed deployment; runtime database variable `2`, JWT variable `1` |
| Public production URL | [Workflow and Approval System](https://workflow-frontend-597719179612.asia-southeast1.run.app) |

The project-number URLs shown by the Console and the older `wkjzb522ga-as.a.run.app` URLs recorded by the release driver identify the corresponding existing services. The driver and its recorded HTTP checks use the latter. During final acceptance review, anonymous GETs to the public demonstration URL `/`, `/version.json` and `/api/version` each returned **HTTP 200**; both version responses reported the full released SHA. The served frontend JavaScript contains the visible badge text and that exact SHA. The [new badge screenshot](evidence/Issue7_Visible_Release_Badge.png) shows the visible change and matching short SHA `44a3fdaf0e3e`, but is cropped without the address bar and shows `Loading...`. Therefore the public URL and full 40-character SHA are corroborated by the independent HTTP/version read-back, not claimed to be visible in the screenshot itself. No endpoint or audience configuration was changed by this review.

### Immutable image and recovery evidence

The run's common image tag is `44a3fdaf0e3e056bc717f64c78c18a9cea53bc05-45314206420-1`. Registry references below come from `images.json`, with prefix `asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval`:

| Image | Published immutable digest |
|---|---|
| operations | `sha256:fe1653033af7d2e262a88dd2c54aa3758acf6d75f792bb1136386e581294ce41` |
| backend | `sha256:305715ebd9e76d6b31975940420952f2eac32388db154137a71dcddccc80a93c` |
| frontend | `sha256:5ee3fafa896fe416776dd8e7af95cce9fd7ce5a694ec7fa273f3484de18aaa4a` |
| token-helper | `sha256:ee00183b6699dd248d9d493129859b1dac8f45b9c0fbd8b28d34c448f7a5bc8d` |

PR #38 corrected provenance verification for OCI indexes: the approved published digest can resolve to a distinct `linux/amd64` manifest digest. The guard verifies manifest content hashes and the selected platform rather than requiring these different objects to have identical digests. It then compares the service's published references, the ready revision's platform references and container status digests. This preserves provenance enforcement; it does not bypass it. Recorded serving digests are:

| Serving container | Platform manifest digest |
|---|---|
| Backend | `sha256:e8af7d686498cb4de5a49c2baba05ccf3c3530b443840c8685ca65c8b946e5dd` |
| Frontend Nginx | `sha256:76cfa8d80dad052cf07855bb6dc9cf45d78b6a13627330773dc3be0e32195da4` |
| Frontend token helper | `sha256:7983e468cfeb00d9ac539805783ab398515be66e8101140c92490becb4cfa44d` |

The [original release artifact](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45314206420/artifacts/14887843671), named `release-44a3fdaf0e3e056bc717f64c78c18a9cea53bc05-45314206420-1`, contains **all six expected files**, inspected without executing them:

| Artifact file | Verified contents |
|---|---|
| `built.json` | Approved SHA/run tag, four image names, runtime database version `2`, JWT version `1` |
| `images.json` | Same SHA/run tag and all four valid immutable registry references above |
| `rollback.json` | Pre-deployment backend `workflow-backend-00003-qjb` and frontend `workflow-frontend-00001-ww7`, actual prior image references; both services listed as attempted and completed |
| `backend-revision.json` | Approved SHA, final backend revision and actual serving image reference |
| `frontend-revision.json` | Approved SHA, final frontend revision and both actual serving image references |
| `verification.json` | `passed`, approved SHA, HTTP 200/200/403/404 and both running-SHA checks; matches the saved evidence copy |

The downloaded archive is `release-44a3fdaf0e3e056bc717f64c78c18a9cea53bc05-45314206420-1.zip` in the operator's Downloads directory. Its local SHA-256 matches GitHub's artifact metadata: `29c2d76db1cc935c8aeb548566fe7b8533e5bfd212b58d94d8bdee44a3ec9348`. The original archive remains untouched. A byte-identical archive copy and all six original JSON records are now preserved under ignored `.local/review/issue7-release-45314206420/` in this worktree. Archive CRCs, JSON schemas/release SHAs, non-sensitive contents and the verification-copy equality passed inspection before preservation; existing mismatched files would not be overwritten. The Actions copy expires **8 December 2026 at 03:57:22 UTC**; the local preservation does not depend on that expiry. Only the verification copy is currently included in the public repository evidence set. Keep the ignored archive/records out of an indiscriminate Git add. The rollback procedure in Section 5 remains approval-only; no rollback execution is claimed.

### Persistence observation and acceptance boundary

The application-level post-deployment screenshot shows `LAB5-ISSUE8-PERSIST-20261122T122806Z-a3b38646` still visible as **PENDING**, with its description and displayed creation time. The earlier nine-field local baseline identifies Request **2**. These screenshots support continued UI visibility after automated redeployment. They do **not** establish database-level equality of all nine fields, a fresh authenticated API comparison, or the separate restart requirement. Full Issue 8 R-04/C-05 completion is not claimed here.

## 1. Requirements and implementation

Official handout `01_SE_Lab_5_updated.pdf`, pages 3-4 and 7-10: Issue 7 covers R-07/R-08/C-06 (reviewed visible change, feature-to-staging PR, release PR into main, passing CI, pipeline deployment and running commit evidence). R-09/R-10 also require specific teammate review, issue/board traceability, labels and preserved history. Issue 8 covers R-04/C-05 (an earlier record survives restart and redeploy). Rollback/rollforward is recommended, not separately required. The Student Guide V1.1 Episodes 7-8 is supporting guidance; the handout takes precedence.

[deploy.yml](../../../.github/workflows/deploy.yml) runs on main pushes or main-only manual dispatch. Validation runs client/backend tests and builds, isolated PostgreSQL tests, private-proxy and release/rotation checks before deployment. Only the deployment job receives OIDC permission. Deployment is **disabled unless GCP_DEPLOY_ENABLED equals true**, and uses the protected `lab5-production` environment. The environment must actually be configured with required teammate approval, prevention of self-review and main-only deployment policy before enabling; its YAML name alone supplies no protection.

Before cloud authorization, the validation job reads back the environment using a step-scoped GitHub token with only `actions: read` and `contents: read`. The [environment guard](../../../deploy/github-environment.mjs) rejects missing/broad branch policies, absent reviewer rules, missing eligible teammate or self-review permission. The cloud job still has only `contents: read` and `id-token: write`. The added Actions permission reads protection metadata; it supplies no repository or cloud write permission.

[release.mjs](../../../deploy/release.mjs) builds exactly four linux/amd64 images: operations (`server`, target `operations`), backend (`server`, `production`), frontend (`client`, `production`), helper (`deploy/token-helper`, `production`). All tags contain the full main SHA, run ID and attempt; existing tags cannot be overwritten. All images receive an OCI source-revision label and are deployed by immutable registry digest. No builder target is uploaded. Actions are pinned to official full commit SHAs verified read-only on 22 November 2026.

Docker builds precede authentication. The dedicated deployment identity receives an 1,800-second token through the official auth action, with credential-file creation and environment exports disabled. The token is scoped to upload/deploy steps; Docker login reads stdin into temporary runner configuration, removed afterward. No token enters a build context or evidence artifact.

The driver rejects dirty/wrong-SHA checkouts, non-main refs/events, stale main runs and unpinned secret versions. The safe publish guard requires a successful, complete, validated registry tag listing before concluding that a run tag is absent; permission, authentication, network and malformed-output failures remain fatal. It refuses schema/migration differences from the released baseline: this visible-metadata change needs **no migration or seed**. A later schema change needs a separately reviewed additive migration/job plan. The deployer gets no SQL, migration-owner, provisioning-job or Secret Manager access.

Existing service URLs, identities, IAM and single-revision 100% traffic are checked before updates. Actual traffic-serving revisions and images are saved for rollback, including after a previous traffic rollback. Backend then frontend are replaced using the existing secure templates; ready revisions, digests, labels and running SHAs are verified. No service creation or IAM change is coded. Failures stop subsequent operations; no automatic rollback is performed.

Remote main is rechecked immediately before each push/replacement. Each replacement carries the captured opaque `metadata.resourceVersion`; a fresh read-back must still match the saved revision/version. Configuration drift in runtime identity, ingress/IAM mode, SQL, sidecar, environment/secret references, ports, volumes, concurrency or timeout fails closed. API conflicts are not retried. Uploaded-image progress and attempted/completed service updates are retained after each operation. GitHub serialization prevents overlapping pipeline deployments; optimistic concurrency protects against outside Console/CLI changes. Git and Cloud Run have no shared transaction, so main can still advance during a single in-flight API call, and the two-service rollout remains non-atomic; no stronger guarantee is claimed.

## 2. Visible release and version contract

The login and signed-in UI display `Lab 5: automated deployment` and a short SHA with full SHA in its title. `/version.json` returns frontend `releaseSha`; proxied `/api/version` returns backend `releaseSha` and opaque process `instanceId`. Both responses are non-cacheable. `RELEASE_SHA` is a non-secret build argument, validated as 40 lowercase hex characters or local `development`, and compiled into the images; a runtime value cannot impersonate another release.

Historical local validation used synthetic SHA `1111111111111111111111111111111111111111`. Those validation images were **not production artifacts** and must not be presented as released images. The actual released SHA, immutable digests, successful run and ready revisions are now recorded in Completed production execution above. Figure 10 now shows the deployed badge and correct 12-character release prefix. Its crop omits the URL and full SHA; the anonymous public version responses supply those checks separately. A settled-page screenshot including the address bar would strengthen presentation but is not substituted for the existing image or invented here.

Anonymous smoke checks expect frontend / 200, proxied /api/health 200, direct backend /api/health 403, helper /_backend_identity 404, and both version endpoints matching the full main SHA. They do not log in or write business records.

A green workflow with the deployment job skipped is not C-06 evidence. Require the deployment job itself to succeed, its verification.json to report passed, and the public versions/ready revisions to match the released SHA. Installing a disabled workflow is only a preparation checkpoint.

## 3. Owner IAM/WIF setup (completed earlier; historical command reference)

The dedicated deployment identity, restricted provider and six scoped bindings were configured and verified in the approved earlier setup. Run #5 subsequently used that deployment identity successfully. The commands below preserve the reviewed setup design; they were not executed during this documentation update and must not be rerun merely to reproduce evidence. For a genuinely new setup, reuse the project, region, registry, pool and enabled APIs, leave Issue 6's authentication account/provider unchanged, obtain approval and stop on any unexpected configuration.

~~~powershell
$ProjectId = 'cpe334-workflow-approval-2026'
$ProjectNumber = '597719179612'
$Region = 'asia-southeast1'
$DeployAccount = "workflow-github-deploy@$ProjectId.iam.gserviceaccount.com"
$WorkflowRef = 'tm-georgia/workflow-and-approval-system/.github/workflows/deploy.yml@refs/heads/main'
gcloud auth list --filter=status:ACTIVE --format='value(account)'
gcloud config get-value project
gcloud projects describe $ProjectId --format='value(projectNumber)'
gcloud iam service-accounts describe $DeployAccount --project=$ProjectId
gcloud iam workload-identity-pools providers describe github-deploy --project=$ProjectId --location=global --workload-identity-pool=github-actions
~~~

The last two commands are existence checks; a confirmed NOT_FOUND means missing, not permission denied. If either resource exists, inspect and stop rather than overwrite. Historical approved creation/binding commands were:

~~~powershell
gcloud iam service-accounts create workflow-github-deploy --display-name='Workflow GitHub Deployment' --project=$ProjectId
$Mapping = 'google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.repository_owner_id=assertion.repository_owner_id,attribute.ref=assertion.ref,attribute.event_name=assertion.event_name,attribute.workflow_ref=assertion.workflow_ref'
$Condition = "attribute.repository_id == '1448556407' && attribute.repository_owner_id == '186666746' && attribute.ref == 'refs/heads/main' && attribute.event_name in ['push', 'workflow_dispatch'] && attribute.workflow_ref == '$WorkflowRef'"
gcloud iam workload-identity-pools providers create-oidc github-deploy --project=$ProjectId --location=global --workload-identity-pool=github-actions --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping=$Mapping --attribute-condition=$Condition
$Principal = "principalSet://iam.googleapis.com/projects/$ProjectNumber/locations/global/workloadIdentityPools/github-actions/attribute.workflow_ref/$WorkflowRef"
gcloud iam service-accounts add-iam-policy-binding $DeployAccount --project=$ProjectId --role=roles/iam.workloadIdentityUser --member=$Principal
gcloud artifacts repositories add-iam-policy-binding workflow-approval --project=$ProjectId --location=$Region --member="serviceAccount:$DeployAccount" --role=roles/artifactregistry.writer
gcloud run services add-iam-policy-binding workflow-backend --project=$ProjectId --region=$Region --member="serviceAccount:$DeployAccount" --role=roles/run.developer
gcloud run services add-iam-policy-binding workflow-frontend --project=$ProjectId --region=$Region --member="serviceAccount:$DeployAccount" --role=roles/run.developer
gcloud iam service-accounts add-iam-policy-binding "workflow-backend@$ProjectId.iam.gserviceaccount.com" --project=$ProjectId --member="serviceAccount:$DeployAccount" --role=roles/iam.serviceAccountUser
gcloud iam service-accounts add-iam-policy-binding "workflow-frontend@$ProjectId.iam.gserviceaccount.com" --project=$ProjectId --member="serviceAccount:$DeployAccount" --role=roles/iam.serviceAccountUser
~~~

Six bindings in total: WIF impersonation on the deployment account, writer on the existing registry, developer on two existing services, actAs on their two runtime identities. These are resource-scoped standard deployment roles, not project Editor/Owner. Cloud Run Developer contains permissions beyond an update; resource scoping limits exposure to the two services. Deploying as runtime identities remains security-sensitive even without direct secret access, so main review and environment approval are essential. No JSON keys, new public grants, service-policy administration, SQL or operations-identity impersonation is requested.

The [official Cloud Run Developer definition](https://docs.cloud.google.com/iam/docs/roles-permissions/run#run.developer) includes `run.services.get`, `run.services.update`, `run.services.getIamPolicy`, `run.revisions.get` and `run.operations.get`, covering the driver's describe, IAM-read, replacement and operation-polling calls. Artifact Registry Writer supplies upload/download/image metadata/tag access; Service Account User supplies `iam.serviceAccounts.actAs`. No additional project Viewer/Admin or custom role is required for these commands. The permission design was reviewed before setup; the previously verified bindings and successful run #5 are the execution record, not a new IAM audit in this documentation review.

Role/trust sources: [Cloud Run deployment permissions](https://docs.cloud.google.com/run/docs/deploying#required_roles), [WIF deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).

## 4. GitHub admin configuration and execution order

Retained permission design (no grants executed by this documentation review):

| Identity | Role / permission | Scope and necessity |
|---|---|---|
| Restricted GitHub workflow principal | Workload Identity User | Deployment account only; WIF impersonation |
| workflow-github-deploy | Artifact Registry Writer | Existing workflow-approval repository; upload/read image content and metadata |
| workflow-github-deploy | Cloud Run Developer | Existing two services individually; get/update/IAM-read/revisions/operations |
| workflow-github-deploy | Service Account User | Existing frontend/backend runtime accounts; actAs during replacement |
| workflow-operations | Existing Cloud SQL Client | Existing project; Cloud SQL connection for the one-off maintenance job |
| workflow-operations | Existing Secret Accessor grants | Rotation uses migration URL and two password secrets; grants are not expanded |
| Existing owner/authorized maintenance operator | Job create/run/get/execution-read; actAs operations | One approved private job; never add these rights to the deployer |
| Approved password-version writer | Versions.add + secrets.get (Version Adder + metadata Viewer if needed) | Two password secrets only; upload/metadata, no payload access |
| Approved password custodian | Secret Accessor if needed | Two password secrets only; direct secure handoff outside agent/chat/logs |
| Existing owner/authorized retirement operator | Versions.disable | Only old demo-password version 1 after successful verification |

Reuse existing operations/human permissions rather than duplicating grants. Any missing human maintenance permission is a separate owner checkpoint, not justification for Editor/Owner or project-wide deployer roles. GitHub permissions are separate: contents read for checkout, actions read for environment metadata, and ID-token write only for the deploy job. Exact GCP role identifiers and six deployment binding commands are in Section 3.

Existing `GCP_PROJECT_ID` is reused. The following non-secret variables are configured; the current values below were read back on 24 November:

Historical pre-setup check on 22 November found the environment and five deployment variables missing. The owner/admin subsequently configured them. The 24 November read-back confirms `lab5-production`, both eligible reviewers, self-review prevention, disabled administrator bypass and the main-only branch policy; run #5's approval history identifies the independent approver. Repository visibility is public. These results supersede the earlier missing-configuration checkpoint; this review changed no settings. [GitHub environment API](https://docs.github.com/en/rest/deployments/environments).

| Variable | Configured value |
|---|---|
| GCP_DEPLOY_SERVICE_ACCOUNT | workflow-github-deploy@cpe334-workflow-approval-2026.iam.gserviceaccount.com |
| GCP_DEPLOY_WIF_PROVIDER | projects/597719179612/locations/global/workloadIdentityPools/github-actions/providers/github-deploy |
| GCP_RUNTIME_DB_VERSION | 2 (runtime database secret version used by the successful release) |
| GCP_JWT_VERSION | 1 (existing numeric JWT version; change only with separate rotation approval) |
| GCP_DEPLOY_ENABLED | false after the completed approved deployment; enable again only for a separately authorized release |

Historical configuration commands, retained for repeatability. They were not run during this review; changing any current value requires separate approval:

~~~powershell
$Repository = 'tm-georgia/workflow-and-approval-system'
gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --repo $Repository --body 'workflow-github-deploy@cpe334-workflow-approval-2026.iam.gserviceaccount.com'
gh variable set GCP_DEPLOY_WIF_PROVIDER --repo $Repository --body 'projects/597719179612/locations/global/workloadIdentityPools/github-actions/providers/github-deploy'
gh variable set GCP_RUNTIME_DB_VERSION --repo $Repository --body '2'
gh variable set GCP_JWT_VERSION --repo $Repository --body '1'
gh variable set GCP_DEPLOY_ENABLED --repo $Repository --body 'false'
~~~

The following is the retained release procedure. The production execution above has completed it; it is not a pending authorization or instruction to repeat a deployment.

1. Review local changes and the resolved dependency assessment below. Use `Refs #32`, and verify `lab5` on the issue and applicable PRs. Correct missing labels only after approval. Do not claim full Issue 8 execution or PDF completion.
2. Owner prepares and verifies the six IAM bindings/provider above. Admin configures `lab5-production`: only main, required teammate reviewer, prevent self-review. Keep deployment disabled.
   Allow both team accounts (`thit3455` and `tm-georgia`) as eligible environment reviewers, with one approval from the account other than the run initiator. Do not configure only `tm-georgia` with self-review prevention if she also merges the release: the resulting main push is initiated by her, so that sole-reviewer configuration would block deployment. Preserve self-review prevention and have the other member approve the environment gate.
3. Bring staging up to date through the reviewed synchronization path when necessary. Obtain all three green CI checks and a specific teammate review for the feature PR into sprint-staging, followed by the release PR into main. Preserve the existing required check names/rulesets. Verify cloud configuration and credential-rotation/persistence readiness before authorizing the production run. The actual integration/release history is recorded in Section 8; no new release is authorized by these instructions.
4. Enable only after explicit cloud approval and environment verification:
   ~~~powershell
   gh variable set GCP_DEPLOY_ENABLED --repo $Repository --body 'true'
   ~~~
   A reviewed main push triggers tests then waits for environment approval. If installation was merged while disabled, explicitly approve one main dispatch:
   ~~~powershell
   gh workflow run deploy.yml --repo $Repository --ref main
   gh run list --repo $Repository --workflow deploy.yml --limit 5
   ~~~
5. In the runner, `node deploy/release.mjs build` performs four exact-target Docker builds; `publish` checks unique tags, stdin-authenticates, pushes four images and resolves their digests; `deploy` describes services/revisions/IAM, renders pinned configurations, runs `gcloud run services replace` for backend then frontend and checks revision/image/version/HTTP evidence. No migration, SQL write, provisioning or IAM mutation occurs.
6. Retain the non-sensitive run artifact: images.json, rollback.json, two revision records, built.json and verification.json. Upload uses an explicit JSON allowlist and permits the hidden .local path; it never includes credential/configuration files or raw logs.
7. For first installation, separately approve and verify the [secure rotation procedure](issue08-persistence.md#3-secure-demo-credential-rotation-commands-prepared-not-executed) with the reviewed maintenance digest before live login. That bootstrap and its session-handling stage are already completed here; do not repeat rotation or create-only provisioning for another release or screenshot. Any future credential change needs its own approval and the same one-hour JWT-session precautions.
8. Compare the approved persistence request without modifying or recreating it. Issue 7's post-redeployment UI observation remains bounded as below; Issue 8 subsequently completed the separate restart and exact nine-field comparisons. Its actual A -> D -> R0 -> replacement -> R1 chronology is in the [persistence runbook](issue08-persistence.md). No new request, restart or redeployment is needed for final reporting.

### 4.1 Exact environment configuration (completed; administrator reference)

The environment already exists with the verified protections described above. Inspect before any separately approved change. The retained API payload configures both eligible users and prevents self-review; only one eligible non-initiator approval is needed. Administrator bypass is disabled in the actual read-back. Do not recreate the environment or duplicate its branch policy.

~~~powershell
$Repository = 'tm-georgia/workflow-and-approval-system'
gh api "repos/$Repository/environments"
$Protection = @{
  wait_timer = 0
  prevent_self_review = $true
  reviewers = @(@{type='User';id=203077129}, @{type='User';id=186666746})
  deployment_branch_policy = @{protected_branches=$false;custom_branch_policies=$true}
}
$Protection | ConvertTo-Json -Depth 6 | gh api --method PUT "repos/$Repository/environments/lab5-production" --input -
if ($LASTEXITCODE -ne 0) { throw 'Environment configuration failed; keep deployment disabled' }
gh api --method POST "repos/$Repository/environments/lab5-production/deployment-branch-policies" -f name=main -f type=branch
if ($LASTEXITCODE -ne 0) { throw 'Branch policy failed; keep deployment disabled' }
gh api "repos/$Repository/environments/lab5-production"
gh api "repos/$Repository/environments/lab5-production/deployment-branch-policies"
~~~

### 4.2 First-installation rotation/baseline bootstrap (historical; do not repeat)

At first installation the old operations image lacked the rotation tool. The separately approved maintenance bootstrap and rotation subsequently completed. The local Stage 2 record identifies execution `workflow-rotate-demo-20261122103603-shtg6`, successful transactional replacement of the two demo-password hashes and password-secret versions `2`; it contains no passwords or hashes. Later user-confirmed Stage 3B completed both HTTP login checks and disabled only the old password-secret versions `1`. Those stages are historical and must not be repeated to collect documentation. Password rotation did not itself revoke stateless JWTs; the one-hour expiry/session precautions in the Issue 8 runbook still apply. JWT signing secret version `1` remains the version used by the successful deployment.

The original conservative bootstrap sequence was: review cloud configuration and the maintenance plan; install the workflow with `GCP_DEPLOY_ENABLED=false`; separately approve one operations build/upload from clean reviewed main; rotate credentials and capture the approved persistence baseline; then authorize the application deployment. It kept application services unchanged during maintenance. This sequence is preserved for context, not as authority for another maintenance operation.

The following are historical maintenance commands, from a clean checkout of reviewed main containing the tool. They do not invoke the application deployment workflow or grant the deployer database access. Do not execute them again without a new, explicit maintenance approval:

~~~powershell
$ProjectId = 'cpe334-workflow-approval-2026'
$Registry = 'asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval'
$MainSha = (git rev-parse HEAD).Trim()
$RemoteMain = ((git ls-remote origin refs/heads/main) -split '\s+')[0]
if ($MainSha -notmatch '^[a-f0-9]{40}$' -or $MainSha -ne $RemoteMain -or (git status --porcelain)) { throw 'Use the clean reviewed main checkout' }
$OperationsTag = "$Registry/operations:rotation-$MainSha-$((Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss'))"
# Inspect tag absence first; stop on an existing tag or a permission error.
gcloud artifacts docker images describe $OperationsTag --project=$ProjectId --format='value(image_summary.digest)'
# Continue only after confirmed NOT_FOUND and explicit image-upload approval.
docker build --platform=linux/amd64 --target operations --build-arg "RELEASE_SHA=$MainSha" --label "org.opencontainers.image.revision=$MainSha" --tag $OperationsTag ./server
if ($LASTEXITCODE -ne 0) { throw 'Operations build failed' }
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet
if ($LASTEXITCODE -ne 0) { throw 'Registry authentication failed' }
docker push $OperationsTag
if ($LASTEXITCODE -ne 0) { throw 'Operations upload failed' }
$OperationsDigest = (gcloud artifacts docker images describe $OperationsTag --project=$ProjectId --format='value(image_summary.digest)').Trim()
if ($LASTEXITCODE -ne 0 -or $OperationsDigest -notmatch '^sha256:[a-f0-9]{64}$') { throw 'Digest verification failed' }
$OperationsImage = "$Registry/operations@$OperationsDigest"
# Next: separately approved new secret versions + one-shot rotation commands in Issue 8.
~~~

The approved persistence baseline was subsequently saved as Request **2**, with marker `LAB5-ISSUE8-PERSIST-20261122T122806Z-a3b38646`. Preserve it unchanged. The first automated deployment has now succeeded, and the saved post-deployment screenshot still shows PENDING. That observation does not substitute for Issue 8's separate process/restart proof and complete field comparisons. No maintenance command was executed during this documentation update.

## 5. Rollback/rollforward procedure (approval-only)

The driver snapshots the actual 100%-traffic ready revisions and opaque resource versions before either service update. `rollback.json` records attempted/completed services; `images.json` is retained after each successful push. Download the matching run artifact into .local/release; inspect current revisions/traffic and the earlier revisions first. Stop if a newer release has already taken traffic; an old run's recovery must not overwrite a subsequent deployment. A failed command or lost response may have applied a change: do not blindly retry or assume no service changed. If the runner terminates before artifact upload, use the existing Cloud Run revision history and last successful release evidence; artifact retention is best-effort on runner termination. Traffic rollback changes no database, IAM or secrets:

~~~powershell
$Previous = Get-Content .local/release/rollback.json -Raw | ConvertFrom-Json
$OldFrontend = $Previous.before.frontend.revision
$OldBackend = $Previous.before.backend.revision
if ($OldFrontend -notmatch '^workflow-frontend-[a-z0-9-]+$' -or $OldBackend -notmatch '^workflow-backend-[a-z0-9-]+$') { throw 'Unexpected rollback revisions' }
gcloud run revisions describe $OldFrontend --project=cpe334-workflow-approval-2026 --region=asia-southeast1
gcloud run revisions describe $OldBackend --project=cpe334-workflow-approval-2026 --region=asia-southeast1
# Each write requires approval. Stop after any failure.
gcloud run services update-traffic workflow-frontend --to-revisions="${OldFrontend}=100" --project=cpe334-workflow-approval-2026 --region=asia-southeast1
if ($LASTEXITCODE -ne 0) { throw 'Frontend rollback failed' }
gcloud run services update-traffic workflow-backend --to-revisions="${OldBackend}=100" --project=cpe334-workflow-approval-2026 --region=asia-southeast1
if ($LASTEXITCODE -ne 0) { throw 'Backend rollback failed' }
~~~

The visible-metadata change preserves API/schema compatibility during partial deployment. For later incompatible changes, review ordering first. Never restore a database snapshot, reset schema/data, revert exposed passwords or alter JWT keys as a rollback shortcut. Recheck HTTP security and expected prior version evidence. Old Issue 5 images have no version endpoint; use their revision/image record and retain the **unverified exact source equivalence** limitation.

After cause review and approval, roll forward by dispatching deploy.yml from current main. The driver permits verified earlier active revisions after rollback and explicitly restores 100% latest traffic, avoiding a permanent rollback traffic pin. No arbitrary feature SHA can be deployed.

## 6. Recorded validation, impact and evidence index

Historical local implementation results: the **full backend suite passed 78 tests in eight files**, including nine rotation cases and two version cases, in a disposable loopback-only PostgreSQL cluster stopped afterward. An initial run had 77 passes and one five-second timeout in the expensive cost-12 rotation/idempotency case; its bounded 20-second timeout preserves all assertions and hashing strength, and the full rerun passed. Prisma generation, backend typechecking/build, **13 release/environment contract tests**, four mocked Python rotation-helper tests and checksum-verified actionlint 1.7.12 passed. Backend/operations Docker targets were rebuilt and inspected with Effect 3.22.1 and unchanged Prisma/config 7.10.1. The unchanged frontend's prior full 21-test result, production build, frontend/helper image builds, Nginx/version/image checks and private-proxy boundary suite were reused. No production or local Compose database was used for those tests; Issue 6 authentication/C-02 were not rerun. These original counts are historical, not asserted to be the later OCI-correction suite's counts. PR #38/#39 CI and run #5 validation are separately linked in Section 8. No application tests or builds were repeated during this final documentation review.

Both named server PR CI and main release validation now enforce `npm audit --omit=dev --audit-level=high`; an advisory-service error or HIGH/CRITICAL finding stops the check rather than being suppressed. Required CI check names are unchanged.

**Dependency finding remediated locally:** the three HIGH entries were one underlying [Effect ReDoS advisory](https://github.com/advisories/GHSA-7589-6fvf-x4pw), propagated through `@prisma/client@7.10.1`'s Prisma peer -> `prisma@7.10.1` -> `@prisma/config@7.10.1` -> exact `effect@3.20.0`. It was confirmed in the old backend runtime image; operations also retains the installed CLI dependencies. No application source directly uses the affected Effect template-literal decoding API, so an exploitable request path was not established, but package presence warranted correction. `server/package.json` now narrowly overrides only `@prisma/config`'s Effect to patched `3.22.1`; the lockfile pins its authoritative npm integrity. Prisma/client/config remain `7.10.1`; schema/migrations and database identities are unchanged. Clean installation, generation and builds pass; full and production-only npm audits report **0 vulnerabilities**. No `npm audit fix --force`, major Prisma downgrade or broad dependency update was used. The rebuilt images are checked separately; audit absence is not a guarantee against every vulnerability.

The completed configuration reuses existing paid infrastructure and added the dedicated deployment service account/provider in the existing pool with six scoped bindings. Each release retains four image versions and up to two Cloud Run revisions, with registry storage/scanning, runner/artifact usage and Cloud Run deployment/cold-start/overlap charges possible. Cloud SQL's existing hourly/storage/backup cost is unchanged. Retain min instances zero, backend max1 and frontend max2; no additional SQL instance, registry, VPC connector, NAT or load balancer was required by this architecture. Exact incremental prices are **unverified and usage-dependent**.

Production execution and documentation integration are complete. Issue #32 is closed with 10/10 tasks; all six implementation/release PRs and documentation PR #40 have lab5. R-09 remains qualified, including #40's retrospective written rationale. Current board Done confirmation and teacher acceptance remain separate. The deployment gate remains false. Issue 8's R-04/C-05 proof is complete; the final report is prepared separately. Optional extra screenshots and rollback/rollforward execution are not required by this cleanup.

All ten files below exist. The eight original screenshots were inspected in the previous review; the new ninth screenshot was inspected in this final acceptance review. No passwords, tokens, cookies, private keys or secret payloads were visible. Secret names/version references, test-account emails, public URLs and service-account identifiers are non-secret metadata. The screenshots are preserved unchanged.

| Figure / relative evidence link | Caption and evidentiary limit |
|---|---|
| 1. [Automated deployment success](evidence/Issue7_Automated_Deployment_Success.png) | C-06 / R-07: Deploy Main Release **#5**, main `44a3fda`, initiated by `tm-georgia`; validation and deployment both green. The authoritative run link above identifies the full SHA. |
| 2. [Backend deployment verified](evidence/Issue7_Backend_Deployment_Verified.png) | C-06 / R-08: final backend `workflow-backend-00004-sck` receives 100% traffic; runtime database secret reference `2`, JWT reference `1`, without payloads. |
| 3. [Backend healthy before final release](evidence/Issue7_Backend_Healthy.png) | **Historical pre-run #5** evidence: backend `workflow-backend-00003-qjb` at 100%, port 8080 and existing limits. This is the pre-deployment rollback revision, not proof of final revision `00004-sck`. |
| 4. [Earlier persistence observation](evidence/Issue7_Database_Persistence.png) | R-04 supporting context only: requester UI shows the unique marker, description, PENDING and displayed original time. Despite its filename, it is a UI screenshot, not a database comparison or an independently timestamped restart proof. |
| 5. [Deployment configuration](evidence/Issue7_Deployment_Config.png) | R-07/R-08: non-secret Actions variables show deployment disabled, database version `2`, JWT version `1`. Long identity/provider values are truncated; earlier verified configuration and workflow execution supply the full context. |
| 6. [Frontend deployment verified](evidence/Issue7_Frontend_Deployment_Verified.png) | C-06 / R-08: `workflow-frontend-00002-flx` receives 100% traffic, deployed by `workflow-github-deploy`; public URL and Nginx/helper containers visible. |
| 7. [Persistence after automated deployment](evidence/Issue7_Persistence_After_Automated_Deployment.png) | R-04 observation after the reported automated redeployment: same unique marker remains visible as PENDING with description and displayed creation time. Does not establish all-nine-field or database-level equality. |
| 8. [Earlier release validation](evidence/Issue7_Release_Validation.png) | **Run #4**, PR #39 merge/main `44a3fda`: validation green and deployment skipped. Historical validation evidence only; Figure 1/run #5 proves actual production deployment. |
| 9. [Final automated verification JSON](evidence/issue07-final-verification.json) | C-06 / R-07/R-08: exact released full SHA, `passed`, recorded 200/200/403/404 and both running-SHA checks; matches original run #5 artifact. |
| 10. [Visible release badge](evidence/Issue7_Visible_Release_Badge.png) | C-06 / R-07/R-08: visible `Lab 5: automated deployment` change and short SHA `44a3fdaf0e3e`, matching the released commit. Cropped application view with `Loading...`; the URL and full SHA are not visible in this image. The separate anonymous public GET/version checks above corroborate the location and complete SHA. No login or request action was performed to verify this evidence. |

The final PDF uses Answer Part 4 for C-06 and Part 3 for C-05. Link the original run artifact and retain the locally preserved archive and records. Figure 10 now supplies the visible badge; pair its caption with the public URL and full-SHA verification rather than pretending the crop contains the address bar. Do not relabel the older run/revision images as final-deployment proof or infer full Issue 8 completion.


## 7. Historical implementation submission (integrated; commands retained for reference)

The original feature PR scope was the 28 implementation files below: pipeline, visible version change, compatible dependency correction, necessary rotation support and Issue 8 preparation. That implementation was integrated through PR #33 and initially released through PR #35; later fixes reached the final release through PR #38/#39. The commands below are historical, not pending operations. The earlier Issue 6 documentation/worktree preservation remains intact. This final local documentation task stages, commits and pushes nothing.

The earlier prepared descriptions remain in ignored `.local/review/issue7-feature-pr.md` and `.local/review/issue7-release-pr.md`. Do not rerun their historical creation commands or submit the implementation a second time. Any future documentation commit/PR requires separate approval and an explicitly reviewed file list; never use `git add .` or add ignored local records.

~~~powershell
git status --short
git diff --check
git add -- .github/workflows/ci.yml client/Dockerfile client/nginx.conf client/src/App.css client/src/App.tsx client/vite.config.ts docs/labs/lab05/deployment.md server/Dockerfile server/package-lock.json server/package.json server/scripts/build.mjs server/src/app.ts .github/workflows/deploy.yml client/src/ReleaseBadge.test.tsx client/src/ReleaseBadge.tsx client/src/release.ts deploy/github-environment.mjs deploy/prepare-demo-rotation.py deploy/release.mjs deploy/test/environment.test.mjs deploy/test/release.test.mjs deploy/test/test_demo_rotation.py docs/labs/lab05/issue07-automated-deployment.md docs/labs/lab05/issue08-persistence.md server/prisma/rotate-demo-credentials.ts server/src/version.ts server/test/rotate-demo-credentials.test.ts server/test/version.test.ts
git diff --cached --check
git diff --cached --stat
git commit -m 'feat(lab5): automate reviewed main releases' -m 'Refs #32'
git push --set-upstream origin feature/lab5-issue-7-8-cd
gh issue edit 32 --repo tm-georgia/workflow-and-approval-system --add-label lab5
gh pr create --repo tm-georgia/workflow-and-approval-system --base sprint-staging --head feature/lab5-issue-7-8-cd --title 'Lab 5 Issue 7: Automated GCP Deployment and Release' --body-file .local/review/issue7-feature-pr.md --label lab5 --reviewer tm-georgia
~~~

Historical release-PR creation command, retained to explain the reviewed staging-to-main path:

~~~powershell
gh pr create --repo tm-georgia/workflow-and-approval-system --base main --head sprint-staging --title 'Lab 5 Release: Automated GCP Deployment and Release' --body-file .local/review/issue7-release-pr.md --label lab5 --reviewer tm-georgia
~~~

The release and run #5 deployment remain completed historical execution. PR #40 integrated the original two-document/ten-evidence-file publication scope; its archive and six original JSON records remain in the existing ignored local review area. This final cleanup changes four Markdown documents only, with no evidence, source, workflow, schema or deployment-setting edits. Issue 8 completion is now recorded separately; final reporting belongs to the team's Google Docs work. The deployment gate remains false.

## 8. Acceptance criteria and remaining submission checks

The locally available official `01_SE_Lab_5_updated.pdf` was read for this review: R-07/R-08 on page 3, R-09/R-10 on page 4, Issue 7/C-06 on page 7 and Answer Part 4 on page 10. R-09 requires a specific check, question, finding or reason in every review; it does **not** specify a minimum word count. Direct PR/run links are valid evidence; screenshots are necessary where those links cannot show a Console setting or visible application state.

| Requirement | Result | Evidence and limitation |
|---|---|---|
| R-07: reviewed main release through repeatable CI/deployment | **PASS** | PR #38 into staging, PR #39 into main, all three PR checks green, independent environment approval and successful run #5 production job. The documented manual environment approval is allowed. The historical R-09 review-timing limitation remains separately recorded below. |
| R-08: identify each release and repeatable procedure | **PASS** | Full main SHA, common run tag, four published immutable digests, serving platform digests, ready revisions, version checks, artifact and retained release/recovery procedure. |
| C-06: reviewed staging-to-main deployment matches running commit | **Operational evidence PASS; R-09 qualification retained** | The successful run, actual ready revisions, matching full public version SHAs and visible badge establish the deployed change. The screenshot's cropped URL is explicitly bounded and separately corroborated. R-07, R-08 and R-10 pass; the historical R-09 qualification remains disclosed rather than claiming unqualified review-process acceptance. |
| R-09: issue/board/branches and specific independent teammate reviews | **QUALIFIED** | Issue #32 is closed; prior In Progress board membership is historical and current Done status requires authorized confirmation. #35/#36/#37 have specific original review reasons. #33/#38/#39/#40 had pre-merge approvals with blank bodies; their specific follow-up comments were retrospective. Teacher acceptance remains outstanding; no new review is fabricated or backdated. |
| R-10: Lab 5 labels and retained history/CI | **PASS** | Final read-only verification confirms `lab5` on Issue #32 and all six PRs #33/#35/#36/#37/#38/#39. The referenced commits, original approvals, follow-up comments and passing CI runs remain available; the original artifact and records are preserved locally. The previous read-only effective-rule queries confirmed both main and sprint-staging require a PR and all three checks below. No history was deleted or rewritten; labels and tracking were corrected separately under the approved final cleanup. |

### Read-only PR and CI traceability

All six PRs reference `#32`, appear in the issue timeline and were merged. `Client Tests and Build`, `Server Tests and Build` and `Private Backend Proxy Checks` are green for each recorded PR head. The original approvals are from `tm-georgia`, whose identity differs from author `thit3455`; no author self-approved:

| PR / role | Reviewed head and merge | Review / CI evidence |
|---|---|---|
| [#33: initial feature](https://github.com/tm-georgia/workflow-and-approval-system/pull/33), into staging | Head `e0c6253865998e10251747bea71c76d2a8058561`; merge `1f7cf7a0bfa99c40ccbc52bb448127ff89974b32` | [Original tm-georgia approval](https://github.com/tm-georgia/workflow-and-approval-system/pull/33#pullrequestreview-6011211155), blank body; specific retrospective comment below; [passing CI](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45002290926); `lab5` present |
| [#35: initial release](https://github.com/tm-georgia/workflow-and-approval-system/pull/35), into main | Head `fad8e43e153642ba9b2e2221b7af6bc3bc1b336d`; merge `d4f3f8f776b00490d35d192ce74724dfeffc12b5` | [Specific tm-georgia review](https://github.com/tm-georgia/workflow-and-approval-system/pull/35#pullrequestreview-6011652577) checks workflow, restricted permissions, immutable digests, version verification and schema scope; [passing CI](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45011107914); `lab5` present |
| [#36: publish-guard fix](https://github.com/tm-georgia/workflow-and-approval-system/pull/36), into staging | Head `2ba5e7a73eea2e5e2909358433686760222b6731`; merge `fb3bbb892a404d33ea9aedb4bc464df09d9054e1` | [Specific original review](https://github.com/tm-georgia/workflow-and-approval-system/pull/36#pullrequestreview-6012605086) covers tag collision checks, fail-closed errors and regression tests; [passing CI](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45029701716); `lab5` present |
| [#37: publish-guard release](https://github.com/tm-georgia/workflow-and-approval-system/pull/37), staging into main | Head `fb3bbb892a404d33ea9aedb4bc464df09d9054e1`; merge `ecbd835d016f763e42c88531ab39020be0d0285f` | [Specific original review](https://github.com/tm-georgia/workflow-and-approval-system/pull/37#pullrequestreview-6012689318) covers the fix, approved file scope and CI; [passing CI](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45031524878); `lab5` present |
| [#38: OCI provenance correction](https://github.com/tm-georgia/workflow-and-approval-system/pull/38), into staging | Head `471aa8e85d5bdf37d05fe797df26ba0c6e9955ee`; merge `0b5c97751443108d077904c538704089d0c74b15` | [Original tm-georgia approval](https://github.com/tm-georgia/workflow-and-approval-system/pull/38#pullrequestreview-6013540318), blank body; specific retrospective comment below; [passing CI](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45049903708); `lab5` now present |
| [#39: final release](https://github.com/tm-georgia/workflow-and-approval-system/pull/39), staging into main | Head `0b5c97751443108d077904c538704089d0c74b15`; merge `44a3fdaf0e3e056bc717f64c78c18a9cea53bc05` | [Original tm-georgia approval](https://github.com/tm-georgia/workflow-and-approval-system/pull/39#pullrequestreview-6013617508), blank body; specific retrospective comment below; [passing CI](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45051834612); `lab5` now present |

### Original approvals versus retrospective technical comments

| PR | Original approval / merge (UTC) | New teammate comment (UTC, 24 November 2026) |
|---|---|---|
| #33 | 22 November 08:23:51 / 08:24:01; original approval body blank | [05:50:40 follow-up](https://github.com/tm-georgia/workflow-and-approval-system/pull/33#issuecomment-7123327651) checks main-only deployment, environment approval and secure GCP authentication |
| #38 | 22 November 17:37:30 / 17:37:38; original approval body blank | [05:51:18 follow-up](https://github.com/tm-georgia/workflow-and-approval-system/pull/38#issuecomment-7123337671) checks OCI platform-digest verification |
| #39 | 22 November 17:56:45 / 18:40:18; original approval body blank | [05:51:41 follow-up](https://github.com/tm-georgia/workflow-and-approval-system/pull/39#issuecomment-7123343564) checks CI/deployment results and matching frontend/backend release SHAs |

The #33/#38/#39 comments were posted after those merges and after run #5 completed at 03:57:29 UTC on 24 November. Documentation PR #40 likewise had an empty approval at 08:07:44 UTC, merged at 08:07:53 UTC, and received its [explicitly retrospective specific comment](https://github.com/tm-georgia/workflow-and-approval-system/pull/40#issuecomment-7126557694) at 08:47:02 UTC. These are valid follow-up evidence, not proof of specific original pre-merge rationale. Teacher acceptance of the R-09 qualification remains required; closure and checklist completion do not resolve it.

### Complete Issue #32 task checklist assessment

The pre-publication read-back recorded **10/10 tasks completed** and a body modification at **06:45:23 UTC on 24 November 2026**. That earlier OPEN/In Progress checkpoint is superseded by Issue #32's closure at 14:50:12 UTC. Assignment to thit3455 and lab5 remain; current board status is unverified. All ten operational tasks below have evidence support. Their completion and the earlier replacement of a 12-task draft do not remove R-09 or alter any original review evidence.

| No. | Exact completed issue task | Verified completion / supporting evidence |
|---|---|---|
| 1 | Configure secure GitHub Actions deployment authentication and permissions. | **COMPLETE**: retained restricted WIF/scoped IAM design, prior approved read-back and successful keyless production execution |
| 2 | Implement the automated deployment workflow restricted to main. | **COMPLETE**: main-only workflow, environment gate and successful main run #5 |
| 3 | Build immutable container images associated with the commit SHA. | **COMPLETE**: `built.json`, `images.json`, exact run tag, four immutable digests and platform-provenance checks |
| 4 | Preserve existing Cloud Run services and persistent Cloud SQL database. | **COMPLETE**: replacements of the existing named services, recorded Cloud SQL architecture and continued persistence-marker visibility; no claim of full Issue 8 equality/restart proof |
| 5 | Implement a visible application change. | **COMPLETE**: release badge screenshot and released public frontend asset |
| 6 | Create a feature PR into sprint-staging. | **COMPLETE**: merged feature/fix PRs #33, #36 and #38 |
| 7 | Create and merge a reviewed release PR from sprint-staging into main. | **COMPLETE**: merged release PRs #35, #37 and #39 with independent pre-merge approval; the retrospective rationale qualification remains separately recorded under R-09 |
| 8 | Verify successful automated deployment to GCP. | **COMPLETE**: run #5 deployment job itself succeeded, actual revision records and `verification.json: passed` |
| 9 | Verify the visible change on the public URL. | **COMPLETE, with the image limit recorded**: the new screenshot shows the change/matching prefix; independent public URL/root/version/asset GETs corroborate the deployed release. The crop itself does not display the URL or settled page |
| 10 | Verify that the running revision matches the released commit. | **COMPLETE**: final revision records and both public version endpoints match full main SHA `44a3fdaf0e3e056bc717f64c78c18a9cea53bc05` |

### Issue #32 acceptance-criteria assessment

| Exact issue acceptance criterion | Result |
|---|---|
| Automated deployment from main succeeds. | **PASS**: run #5 / main SHA above |
| The public application displays the released change. | **PASS with documented screenshot boundary**: visible badge, matching prefix and independent public URL/version/asset read-back |
| The running revision can be traced to the released commit SHA. | **PASS**: preserved image/revision records and both full-SHA responses |
| Existing database and security architecture are preserved. | **PASS for Issue 7 scope**: existing-service rollout, private-backend verification, unchanged architecture and application-level persistence observation; full Issue 8 verification remains separate |
| PR links, CI/CD runs and deployment evidence are documented. | **PASS locally**: all six PRs, passing CI, run, revisions, images and ten-file index are recorded; submission is still uncommitted and requires separately approved Git publication |

Publication and qualification:

1. Preserve and disclose the original blank approvals and the dated follow-up rationale. R-09 remains QUALIFIED; do not backdate, replace history or recreate PRs to imply specific written rationale existed before merging. Unqualified instructor acceptance of that historical evidence is not asserted.
2. **Publication completed:** PR #40 merged at `fcc1bfa0fb18372769cb24ba52e83e97eff90ce4` with all three required CI checks passing. The original 12-file allowlist (two Markdown files and ten evidence files) remains the historical publication record; all screenshots, archive and six JSON records are preserved. The [deployment overview](deployment.md#1-purpose) and this runbook now reflect closure and retain #40's retrospective-review qualification. This separate four-document cleanup needs genuine teammate review; it does not authorize another deployment.

**OPERATIONALLY COMPLETE AND INTEGRATED, with R-09 QUALIFIED.** R-07/R-08 pass and C-06 has Operational evidence PASS; the Issue 7 labels, 10/10 checklist and documentation integration are complete. Issue #32 is closed, with current board Done confirmation still manual. Teacher acceptance of the historical review qualification remains outstanding. Issue 8 is complete for its tested record. The final report is prepared separately in Google Docs; no additional implementation issue, PDF, deployment or credential operation is created here.
