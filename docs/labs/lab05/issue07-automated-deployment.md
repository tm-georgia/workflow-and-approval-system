# Lab 5 Issue 7 (#32): Automated Deployment and Release

Status: **LOCAL IMPLEMENTATION ONLY; CLOUD EXECUTION PENDING APPROVAL**. Branch `feature/lab5-issue-7-8-cd` is synchronized to `origin/sprint-staging` at `2da93cc2583628b4e1009b42db60b7c228fafb60`, the verified merge of PR #31. The original 24 implementation files were retained; staged Issue 6 documentation/evidence remains intact. The entire pre-sync worktree is preserved separately on `feature/lab5-issue7-preserved-20261122`, with a file-hash snapshot under ignored `.local/issue7-preservation/`. No reset, commit, push or merge was used. The original Issue 6 worktree at `4d027f7` was not modified. Current main remains `ef521b600b3548449487df7eeda5f5cea076c4a1`.

Tracking: [Issue #32](https://github.com/tm-georgia/workflow-and-approval-system/issues/32), OPEN; project-board In Progress is user-confirmed, not independently verified with the current token. Read-back found no issue label: adding existing `lab5` remains an approval-only GitHub action. Issue 7 completion is R-07/R-08/C-06; Issue 8 persistence execution and Issue 9 PDF assembly are separate.

## 1. Requirements and implementation

Official handout `01_SE_Lab_5_updated.pdf`, pages 3-4 and 7-10: Issue 7 covers R-07/R-08/C-06 (reviewed visible change, feature-to-staging PR, release PR into main, passing CI, pipeline deployment and running commit evidence). R-09/R-10 also require specific teammate review, issue/board traceability, labels and preserved history. Issue 8 covers R-04/C-05 (an earlier record survives restart and redeploy). Rollback/rollforward is recommended, not separately required. The Student Guide V1.1 Episodes 7-8 is supporting guidance; the handout takes precedence.

[deploy.yml](../../../.github/workflows/deploy.yml) runs on main pushes or main-only manual dispatch. Validation runs client/backend tests and builds, isolated PostgreSQL tests, private-proxy and release/rotation checks before deployment. Only the deployment job receives OIDC permission. Deployment is **disabled unless GCP_DEPLOY_ENABLED equals true**, and uses the protected `lab5-production` environment. The environment must actually be configured with required teammate approval, prevention of self-review and main-only deployment policy before enabling; its YAML name alone supplies no protection.

Before cloud authorization, the validation job reads back the environment using a step-scoped GitHub token with only `actions: read` and `contents: read`. The [environment guard](../../../deploy/github-environment.mjs) rejects missing/broad branch policies, absent reviewer rules, missing eligible teammate or self-review permission. The cloud job still has only `contents: read` and `id-token: write`. The added Actions permission reads protection metadata; it supplies no repository or cloud write permission.

[release.mjs](../../../deploy/release.mjs) builds exactly four linux/amd64 images: operations (`server`, target `operations`), backend (`server`, `production`), frontend (`client`, `production`), helper (`deploy/token-helper`, `production`). All tags contain the full main SHA, run ID and attempt; existing tags cannot be overwritten. All images receive an OCI source-revision label and are deployed by immutable registry digest. No builder target is uploaded. Actions are pinned to official full commit SHAs verified read-only on 22 November 2026.

Docker builds precede authentication. The dedicated deployment identity receives an 1,800-second token through the official auth action, with credential-file creation and environment exports disabled. The token is scoped to upload/deploy steps; Docker login reads stdin into temporary runner configuration, removed afterward. No token enters a build context or evidence artifact.

The driver rejects dirty/wrong-SHA checkouts, non-main refs/events, stale main runs and unpinned secret versions. It refuses schema/migration differences from the released baseline: this visible-metadata change needs **no migration or seed**. A later schema change needs a separately reviewed additive migration/job plan. The deployer gets no SQL, migration-owner, provisioning-job or Secret Manager access.

Existing service URLs, identities, IAM and single-revision 100% traffic are checked before updates. Actual traffic-serving revisions and images are saved for rollback, including after a previous traffic rollback. Backend then frontend are replaced using the existing secure templates; ready revisions, digests, labels and running SHAs are verified. No service creation or IAM change is coded. Failures stop subsequent operations; no automatic rollback is performed.

Remote main is rechecked immediately before each push/replacement. Each replacement carries the captured opaque `metadata.resourceVersion`; a fresh read-back must still match the saved revision/version. Configuration drift in runtime identity, ingress/IAM mode, SQL, sidecar, environment/secret references, ports, volumes, concurrency or timeout fails closed. API conflicts are not retried. Uploaded-image progress and attempted/completed service updates are retained after each operation. GitHub serialization prevents overlapping pipeline deployments; optimistic concurrency protects against outside Console/CLI changes. Git and Cloud Run have no shared transaction, so main can still advance during a single in-flight API call, and the two-service rollout remains non-atomic; no stronger guarantee is claimed.

## 2. Visible release and version contract

The login and signed-in UI display `Lab 5: automated deployment` and a short SHA with full SHA in its title. `/version.json` returns frontend `releaseSha`; proxied `/api/version` returns backend `releaseSha` and opaque process `instanceId`. Both responses are non-cacheable. `RELEASE_SHA` is a non-secret build argument, validated as 40 lowercase hex characters or local `development`, and compiled into the images; a runtime value cannot impersonate another release.

Local validation uses synthetic SHA `1111111111111111111111111111111111111111`. These uncommitted-source validation images are **not production artifacts** and must not be uploaded or claimed as images of `ef521b6`. The actual new release SHA, four registry digests, run URL and ready revisions remain pending the reviewed main release.

Anonymous smoke checks expect frontend / 200, proxied /api/health 200, direct backend /api/health 403, helper /_backend_identity 404, and both version endpoints matching the full main SHA. They do not log in or write business records.

A green workflow with the deployment job skipped is not C-06 evidence. Require the deployment job itself to succeed, its verification.json to report passed, and the public versions/ready revisions to match the released SHA. Installing a disabled workflow is only a preparation checkpoint.

## 3. Owner IAM/WIF commands (prepared, NOT EXECUTED)

Reuse the project, region, registry, pool and enabled APIs. Do not alter Issue 6's authentication account/provider. Execute commands individually only after approval and stop on any failure or unexpected existing configuration.

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

The last two commands are existence checks; a confirmed NOT_FOUND means missing, not permission denied. If either resource exists, inspect and stop rather than overwrite. Approved creation/bindings would be:

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

The [official Cloud Run Developer definition](https://docs.cloud.google.com/iam/docs/roles-permissions/run#run.developer) includes `run.services.get`, `run.services.update`, `run.services.getIamPolicy`, `run.revisions.get` and `run.operations.get`, covering the driver's describe, IAM-read, replacement and operation-polling calls. Artifact Registry Writer supplies upload/download/image metadata/tag access; Service Account User supplies `iam.serviceAccounts.actAs`. No additional project Viewer/Admin or custom role is required for these commands. This validates the permission design, not live grants to an account that has not yet been configured.

Role/trust sources: [Cloud Run deployment permissions](https://docs.cloud.google.com/run/docs/deploying#required_roles), [WIF deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).

## 4. GitHub admin configuration and execution order

Permission summary (no grants executed):

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

Existing `GCP_PROJECT_ID` is reused. The following non-secret variables need approval/admin configuration:

Read-only verification on 22 November 2026: repository is public, so required reviewers and branch restrictions are supported on current Free/Pro/Team plans; the specific account billing plan was not read. Current authorization has push/triage/read but no admin/maintain permissions. Environment administration needs the owner/admin; variable-write capability was not tested through a prohibited mutation. Public environment listing returned HTTP 200 with total 0, and `lab5-production` returned 404: it is **MISSING**. All five deployment-specific variables below returned 404; existing `GCP_PROJECT_ID` exactly matched. No configuration was changed. [GitHub feature availability](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [environment API](https://docs.github.com/en/rest/deployments/environments).

| Variable | Planned value |
|---|---|
| GCP_DEPLOY_SERVICE_ACCOUNT | workflow-github-deploy@cpe334-workflow-approval-2026.iam.gserviceaccount.com |
| GCP_DEPLOY_WIF_PROVIDER | projects/597719179612/locations/global/workloadIdentityPools/github-actions/providers/github-deploy |
| GCP_RUNTIME_DB_VERSION | 1 (existing numeric runtime database secret version) |
| GCP_JWT_VERSION | 1 (existing numeric JWT version; change only with separate rotation approval) |
| GCP_DEPLOY_ENABLED | false initially; true only after IAM/environment/source approval |

Approval-only commands; these were not run:

~~~powershell
$Repository = 'tm-georgia/workflow-and-approval-system'
gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --repo $Repository --body 'workflow-github-deploy@cpe334-workflow-approval-2026.iam.gserviceaccount.com'
gh variable set GCP_DEPLOY_WIF_PROVIDER --repo $Repository --body 'projects/597719179612/locations/global/workloadIdentityPools/github-actions/providers/github-deploy'
gh variable set GCP_RUNTIME_DB_VERSION --repo $Repository --body '1'
gh variable set GCP_JWT_VERSION --repo $Repository --body '1'
gh variable set GCP_DEPLOY_ENABLED --repo $Repository --body 'false'
~~~

1. Review local changes and the resolved dependency assessment below. Use `Refs #32`, add existing `lab5` to Issue #32 and the feature/release PRs only after approval. Do not claim Issue 8 execution or PDF completion.
2. Owner prepares and verifies the six IAM bindings/provider above. Admin configures `lab5-production`: only main, required teammate reviewer, prevent self-review. Keep deployment disabled.
   Allow both team accounts (`thit3455` and `tm-georgia`) as eligible environment reviewers, with one approval from the account other than the run initiator. Do not configure only `tm-georgia` with self-review prevention if she also merges the release: the resulting main push is initiated by her, so that sole-reviewer configuration would block deployment. Preserve self-review prevention and have the other member approve the environment gate.
3. Synchronization to current staging is complete without a merge/reset. Separately approve the feature commit/PR into sprint-staging; obtain all three green CI checks and a specific teammate review. Follow with a reviewed release PR into main. Both branches require all three checks; preserve check names/rulesets. Do not merge the release PR until cloud configuration is verified, dependency disposition accepted, and credential-rotation/persistence-baseline prerequisites are reviewed and ready. The first-installation bootstrap below needs explicit approval; no release merge is authorized here.
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
7. Before further live account login, separately approve the [secure rotation procedure](issue08-persistence.md#3-secure-demo-credential-rotation-commands-prepared-not-executed) using the **new reviewed operations digest**, not the old Issue 5 digest or a local fixture image. Do not rerun create-only provisioning. Observe the one-hour JWT-session caveat and use the approved bootstrap below where rotation/baseline must precede the first app deployment.
8. Issue 8 separately plans one approved uniquely marked future request and A/B/C evidence. No production request, restart or redeployment was performed here. Keep its execution/results distinct from Issue 7 C-06 and Issue 9 submission work.

### 4.1 Exact environment configuration (administrator, approval-only)

Inspect first; if an environment already exists unexpectedly, stop for review. The following documented API payload configures both eligible users and prevents the run initiator approving their own deployment. Only one eligible non-initiator approval is needed. Where the GitHub UI exposes an administrator-bypass option, disable it and retain its settings evidence; it is not assumed verified by an omitted REST field.

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

### 4.2 First-installation rotation/baseline bootstrap (separate approval)

The old operations image lacks the new rotation tool. Do not claim rotation completed or allow a live login before it runs. To keep maintenance code sourced from reviewed main, the conservative bootstrap is: verify all cloud configuration and approve the rotation/baseline procedures before the release merge; merge workflow installation only with `GCP_DEPLOY_ENABLED=false`; separately approve one operations-image build/upload from that exact clean main checkout; rotate and capture the approved baseline; then enable and dispatch the app deployment. No application service changes during the installation/maintenance steps. If the release approver requires **completed** rotation/baseline before any main merge, this sequence does not satisfy that stricter condition: keep the release blocked and obtain an approved maintenance alternative, rather than build unreviewed code or silently relax the condition.

The following are future maintenance commands only, from a clean checkout of the newly reviewed main containing the tool. They do not invoke the app deployment workflow or grant the deployer database access:

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

After verified rotation/session expiry, create the one approved unique persistence record and save its actual ID/fields. Keep that record unchanged across the first automated release, then take Issue 8's process/version baseline before its controlled restart and subsequent automated redeploy. The first release remains blocked until the owner accepts this exact sequence and the maintenance prerequisites are ready. No bootstrap command was executed locally.

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

## 6. Validation, impact and remaining evidence

Final local results: the **full backend suite passed 78 tests in eight files**, including nine rotation cases and two version cases, in a disposable loopback-only PostgreSQL cluster stopped afterward. An initial run had 77 passes and one five-second timeout in the expensive cost-12 rotation/idempotency case; its bounded 20-second timeout preserves all assertions and hashing strength, and the full rerun passed. Prisma generation, backend typechecking/build, **13 release/environment contract tests**, four mocked Python rotation-helper tests and checksum-verified actionlint 1.7.12 passed. Backend/operations Docker targets were rebuilt and inspected with Effect 3.22.1 and unchanged Prisma/config 7.10.1. The unchanged frontend's prior full 21-test result, production build, frontend/helper image builds, Nginx/version/image checks and private-proxy boundary suite are reused. No production or local Compose database was used; Issue 6 authentication/C-02 were not rerun.

Both named server PR CI and main release validation now enforce `npm audit --omit=dev --audit-level=high`; an advisory-service error or HIGH/CRITICAL finding stops the check rather than being suppressed. Required CI check names are unchanged.

**Dependency finding remediated locally:** the three HIGH entries were one underlying [Effect ReDoS advisory](https://github.com/advisories/GHSA-7589-6fvf-x4pw), propagated through `@prisma/client@7.10.1`'s Prisma peer -> `prisma@7.10.1` -> `@prisma/config@7.10.1` -> exact `effect@3.20.0`. It was confirmed in the old backend runtime image; operations also retains the installed CLI dependencies. No application source directly uses the affected Effect template-literal decoding API, so an exploitable request path was not established, but package presence warranted correction. `server/package.json` now narrowly overrides only `@prisma/config`'s Effect to patched `3.22.1`; the lockfile pins its authoritative npm integrity. Prisma/client/config remain `7.10.1`; schema/migrations and database identities are unchanged. Clean installation, generation and builds pass; full and production-only npm audits report **0 vulnerabilities**. No `npm audit fix --force`, major Prisma downgrade or broad dependency update was used. The rebuilt images are checked separately; audit absence is not a guarantee against every vulnerability.

Reuse all existing paid infrastructure. Proposed configuration adds one non-billable deployment service account/provider in the existing pool and six scoped bindings. Each release retains four image versions and up to two Cloud Run revisions, with registry storage/scanning, runner/artifact usage and Cloud Run deployment/cold-start/overlap charges possible. Cloud SQL's existing hourly/storage/backup cost is unchanged. Keep min instances zero, backend max1 and frontend max2; no new SQL instance, registry, VPC connector, NAT or load balancer. Exact incremental prices are **unverified and usage-dependent**.

Mandatory Issue 7 work after local approval: add `lab5` to Issue #32/PR, owner/admin setup, review the compatible dependency override, reviewed feature/release PRs, approved rotation/baseline readiness, approved cloud execution and C-06 live visible/version proof. Local code is synchronized and no local dependency vulnerability remains in npm's current report. Local builds are not deployment proof. Main and staging require client/server/proxy checks; no gate change was made. Issue 8's live C-05 and Issue 9 PDF remain separate unfinished work. Additional settings screenshots and rollback/rollforward demonstration are optional.

| Proposed filename (not saved) | Evidence |
|---|---|
| 15-deployment-pr-review.png | Labelled feature/release PRs, substantive teammate review and passing CI |
| 16-deployment-pipeline.png | Successful main deployment, released full SHA and four digests |
| 17-live-release-version.png | Public URL, visible footer, both version SHAs, ready revisions |
| 18-private-backend-after-release.png | 200/200/403/404 security boundaries, no credentials |
| 19-deployment-identity-scope.png | Narrow WIF, resource bindings and protected environment |
| 20-25 | See [Issue 8 persistence index](issue08-persistence.md#4-evidence-index-and-acceptance-boundary) |

The final PDF uses Answer Part 4 for C-06 and Part 3 for C-05. Do not invent any screenshot/run/digest or claim production credentials have already been rotated.


## 7. Proposed Git submission (NOT EXECUTED)

Feature PR scope is the 28 explicit files below: Issue 7 pipeline, safe version change, compatible dependency correction, directly necessary rotation support and Issue 8 preparation documentation only. No screenshots or live Issue 8 results are added. The original Issue 6 record is already in the synchronized staging base and is not resubmitted as new work. Current index is unstaged; no commit/push/PR was performed.

Prepared non-secret PR descriptions: .local/review/issue7-feature-pr.md and .local/review/issue7-release-pr.md. Commands below require separate approval, current base checks and actual GitHub authentication. Inspect staged content before committing; never use git add . or add ignored local records.

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

After the feature is reviewed with specific rationale, all three CI checks pass and it is merged to staging under separate approval, prepare the release PR only:

~~~powershell
gh pr create --repo tm-georgia/workflow-and-approval-system --base main --head sprint-staging --title 'Lab 5 Release: Automated GCP Deployment and Release' --body-file .local/review/issue7-release-pr.md --label lab5 --reviewer tm-georgia
~~~

Do not merge or enable auto-merge here. Keep the release blocked until the owner verifies cloud configuration, credential-rotation/baseline readiness and accepts the documented first-installation bootstrap. Actual deployment and C-06 evidence finish Issue 7; live C-05 finishes Issue 8 separately. PDF assembly belongs to Issue 9.
