# Lab 5 Issue 8: Database Persistence and Recovery Preparation

Status: **LOCAL PREPARATION ONLY**. No production credentials were retrieved or rotated, no production data was written, no application instance was restarted, and no cloud deployment was performed for this work.

The official `01_SE_Lab_5_updated.pdf`, page 7, requires Issue 8 **R-04 / C-05**: earlier data remains after an application restart and after automated redeployment, supported by before/after screenshots. Pages 5-6 recommend recovery/rollback; it is useful operational evidence, not a separately scored persistence demonstration. The final PDF places persistence in **Answer Part 3** and repeatable release in **Part 4**. Do not claim these live checks are complete before their actual approved execution.

## 1. Existing baseline and boundaries

- Project `cpe334-workflow-approval-2026`; region `asia-southeast1`.
- Existing Cloud SQL `workflow-db`, PostgreSQL 17, database `workflow`; retain its instance size, backups, deletion protection and networking.
- Existing public `workflow-frontend` calls the IAM-protected `workflow-backend` through Nginx and the internal identity-token helper. Preserve service accounts, secret references, Cloud SQL attachment and IAM policies.
- Existing Request #1 was approved by Reviewer #2 and was visible after the requester signed in again. Preserve it as supplementary historical evidence. For the next approved Issue 8 demonstration, plan exactly one new, uniquely marked persistence request as described below; do not create it during local preparation.
- Issue 6 authenticated successfully in [run 44987606342](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/44987606342) at main `ef521b600b3548449487df7eeda5f5cea076c4a1`. That successful authentication and the historical failing-CI demonstration must not be repeated to prepare Issue 8.
- Exposed demonstration passwords require the separately approved rotation below **before any further live login**. Existing exact deployed-source equivalence remains unverified; future Issue 7 releases record source SHA and immutable digests explicitly.

## 2. Persistence evidence protocol (future approval required)

After credential rotation succeeds and session-expiry requirements are satisfied, obtain explicit approval for exactly one production test-request creation. In a trusted terminal, prepare a public unique title, without making any network request:

```powershell
$PersistenceMarker = 'LAB5-ISSUE8-PERSIST-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8)
$PersistenceMarker
```

Under that later approval, sign in through the existing public frontend and submit exactly one request with this title and a non-sensitive description stating that it is the Issue 8 restart/redeployment persistence record. Record the actual generated request ID, title, complete description, original PENDING status, requester/assigned-reviewer IDs and timestamps. Do not invent an ID or screenshot. Do not approve, edit or resubmit this marked request between checkpoints; unchanged PENDING is a valid persistence result. If a duplicate exists or submission outcome is uncertain, stop and inspect history rather than submit again.

Capture the same business fields at **A: after that single approved creation, before restart**, **B: after restart/replacement**, and **C: after automated redeployment**. Use the same account, unique marker, actual request ID and screenshots/exports throughout. Dates in screenshots may use browser-local time; compare underlying values in UTC.

| Record | Fields to compare exactly |
|---|---|
| Unique Issue 8 persistence request | `id`, `title`, `description`, `status`, `requesterId`, `assignedReviewerId`, `reviewerId`, `createdAt`, `decidedAt`; all must match A/B/C exactly |
| Supplementary Request #1 | Same safe request fields; retain its previously APPROVED outcome without modifying it |
| Two demo accounts | `id`, `email`, `role`, `createdAt` only; never select password hashes |
| Database configuration | Same Cloud SQL connection name and application database; no drop/reset/reseed or migration reset |
| Application deployment | Main source SHA, image digests, backend/frontend ready revision names and traffic |
| Process identity | `/api/version` release SHA and opaque instance identifier, before and after the restart/replacement |

At A, capture requester history showing the complete unique marker, actual new request ID and its saved business fields. Request #1 APPROVED, Reviewer #2 and its decision timestamp can appear as supplementary evidence. Save read-only evidence from the existing Cloud SQL-authorized connection if available. Never add authorized public networks or put credentials in commands. The following SQL has no password/hash/secret columns; bind `$1` to the actual unique request ID recorded after the approved creation, rather than substituting a guessed ID:

```sql
BEGIN READ ONLY;
SELECT "id", "email", "role", "createdAt"
FROM public."User"
WHERE "email" IN ('lab5-requester@example.test', 'lab5-reviewer@example.test')
ORDER BY "id";

SELECT "id", "title", "description", "status", "requesterId",
       "assignedReviewerId", "reviewerId", "createdAt", "decidedAt"
FROM public."Request" WHERE "id" IN ($1::integer, 1) ORDER BY "id";
COMMIT;
```

Use a parameterized SQL client for `$1`, or record the approved integer in the chosen read-only query tool. Repeat only these read-only UI/API/SQL comparisons at B and C. Do not submit another request, approve the marked request, seed, provision, truncate or reset data. If a field differs, stop and investigate rather than manufacturing matching evidence.

### 2.1 Application restart evidence

Cloud Run has no generic `restart service` command. A browser reload, closing a tab, switching traffic, or seeing the same revision is not proof of a process restart. A controlled replacement revision of the **same immutable images and application configuration**, after explicit approval, is the practical Cloud Run demonstration. Record the old/new ready revisions, process-instance identifiers, unchanged image digests and unchanged business records. State clearly in the report that Cloud Run instance replacement was used; obtain instructor confirmation if the handout expects a literal restart of the same process.

The backend-only procedure below keeps the **same current image digest** and adds a unique non-secret revision marker, with no schema operation or frontend change. Do not use an unreviewed broad update that could accidentally replace the two-container frontend or alter runtime settings. Do not modify IAM or force idle instances to terminate. If process identifiers do not change, the restart evidence is **NOT VERIFIED**; do not label a browser refresh as a restart.

For this backend-process persistence check, the following narrowly scoped alternative creates a replacement backend revision only; the frontend sidecar configuration is untouched. Execute only after explicit approval, with a verified single-revision 100% traffic baseline, and after the version endpoint has been released. `LAB5_RESTART_MARKER` is a non-secret deployment marker, ignored by the application, used solely to force a fresh process. It is not a credential or a database setting.

```powershell
$ProjectId = 'cpe334-workflow-approval-2026'
$Region = 'asia-southeast1'
$RestartStamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
# Read-only: record current image digest, ready revision and traffic first.
gcloud run services describe workflow-backend --project=$ProjectId --region=$Region --format='yaml(status.latestReadyRevisionName,status.traffic,spec.template.spec.containers[0].image)'
# Approval-only write: keep image, SQL attachment, identity, secrets and IAM.
gcloud run services update workflow-backend --project=$ProjectId --region=$Region --container=backend --revision-suffix="restart-$RestartStamp" --update-env-vars="LAB5_RESTART_MARKER=$RestartStamp"
if ($LASTEXITCODE -ne 0) { throw 'Stop: controlled backend replacement failed' }
gcloud run services update-traffic workflow-backend --project=$ProjectId --region=$Region --to-latest
if ($LASTEXITCODE -ne 0) { throw 'Stop: replacement traffic failed' }
gcloud run services describe workflow-backend --project=$ProjectId --region=$Region --format='yaml(status.latestReadyRevisionName,status.traffic,spec.template.spec.containers[0].image)'
Invoke-RestMethod https://workflow-frontend-wkjzb522ga-as.a.run.app/api/version
```

Compare old/new instance IDs and revisions, require the same full release SHA and immutable image digest, and repeat the read-only business-record comparison. The next reviewed automated deployment removes this marker through the complete approved template. The commands above are not a database restart and were not executed here.

### 2.2 Automated redeployment evidence

After B, use the reviewed Issue 7 main-only deployment workflow, not a manual source deployment. Capture its successful run URL, exact released commit, immutable images and the visible application change. Compare A/B/C business fields, show C's backend/frontend version SHA equals the workflow's released SHA, and confirm the same Cloud SQL instance/database is attached. This actual redeploy remains approval-only; local tests cannot substitute for it.

Run the previously established HTTP security checks as part of the approved new release verification: frontend `/` 200, frontend `/api/health` 200, direct unauthenticated backend `/api/health` 403, and frontend `/_backend_identity` 404. Preserve the private backend and public frontend; do not use a public backend as a test workaround.

## 3. Secure demo-credential rotation (commands prepared, NOT EXECUTED)

The existing create-only provisioning tool refuses existing accounts and is not a password-rotation mechanism. The new `server/prisma/rotate-demo-credentials.ts` updates only `passwordHash` on the two fixed existing demo accounts. It checks their REQUESTER/REVIEWER roles, locks both rows and commits one transaction; IDs, roles, timestamps and requests are preserved. It uses bcrypt cost 12, requires distinct fresh passwords (16 characters minimum, at most 72 UTF-8 bytes), and logs only fixed outcome messages. Before committing, it reads back both hashes internally and verifies them against the exact replacement values injected from the pinned new secret versions, plus unchanged account IDs/roles. Hashes and secret values are never printed. Both already-matching replacement versions are recognized without a write; a partially reused pair fails closed.

The runtime database role does **not** have UPDATE on `User.passwordHash`; do not expand it. Run this one-off tool through the existing `workflow-operations` service account using `workflow-migration-database-url`, whose schema-owner identity can update the accounts. Do not use the PostgreSQL administrator account. The operations image must be a **newly reviewed immutable image containing this tool**, not the old Issue 5 operations digest.

Required future human permissions: read project/secret metadata, `secretmanager.versions.add` on the two existing demo-password secrets (resource-scoped `roles/secretmanager.secretVersionAdder`), Cloud Run job create/execute/read permissions, and `iam.serviceAccounts.actAs` on `workflow-operations`. Its existing Cloud SQL Client and four resource-level secret-access grants are reused. The CI deployment identity must not gain password-secret access, job-creation rights or migration-owner access for this operation.

First review and approve the released operations image digest and the rotation. Then execute, from the reviewed source checkout in a trusted local terminal with `gcloud` on PATH:

```powershell
# Explicitly approved future write: fresh passwords go only through stdin to
# two EXISTING Secret Manager secrets. No values are printed or written to files.
python deploy/prepare-demo-rotation.py --approve-secret-writes
```

The helper checks the active project, project number and account, verifies both existing secrets, generates two independent cryptographic passwords in memory, and adds versions with `--data-file=-` without a trailing newline. It prints **only version numbers and public identifiers**. It neither executes the database tool nor retrieves secret values. If either version creation fails, stop, preserve the reported partial version IDs and involve the owner; do not recreate/delete resources or silently select `latest`.

Record the returned numeric versions, then prepare the one-off job command. These `Read-Host` prompts request public metadata, never credentials:

```powershell
$ProjectId = 'cpe334-workflow-approval-2026'
$Region = 'asia-southeast1'
$OperationsImage = Read-Host 'Reviewed operations image reference ending @sha256:<64 hex>'
$RequesterVersion = Read-Host 'New numeric workflow-requester-password version'
$ReviewerVersion = Read-Host 'New numeric workflow-reviewer-password version'
$RotationJob = 'workflow-rotate-demo-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
if ($OperationsImage -notmatch '^asia-southeast1-docker\.pkg\.dev/cpe334-workflow-approval-2026/workflow-approval/operations@sha256:[a-f0-9]{64}$') { throw 'Unapproved image reference' }
if ($RequesterVersion -notmatch '^[1-9][0-9]*$' -or $ReviewerVersion -notmatch '^[1-9][0-9]*$') { throw 'Pin numeric versions' }
if ([long]$RequesterVersion -le 1 -or [long]$ReviewerVersion -le 1) { throw 'Use the newly generated versions, never the exposed baseline version 1' }

# Inspect first. If the chosen job already exists, stop rather than overwrite it.
gcloud run jobs list --project=$ProjectId --region=$Region --format='value(metadata.name)'

# Approval-only commands below: create exactly one job, then execute it once.
gcloud run jobs create $RotationJob `
  --project=$ProjectId --region=$Region `
  --image=$OperationsImage `
  --service-account=workflow-operations@cpe334-workflow-approval-2026.iam.gserviceaccount.com `
  --set-cloudsql-instances=cpe334-workflow-approval-2026:asia-southeast1:workflow-db `
  --set-secrets="DATABASE_URL=workflow-migration-database-url:1,REQUESTER_PASSWORD=workflow-requester-password:${RequesterVersion},REVIEWER_PASSWORD=workflow-reviewer-password:${ReviewerVersion}" `
  --set-env-vars=ROTATION_CONFIRMATION=rotate-existing-lab5-demo-accounts `
  --command=node --args=--import,tsx,prisma/rotate-demo-credentials.ts `
  --tasks=1 --parallelism=1 --max-retries=0 --cpu=1 --memory=512Mi --task-timeout=10m
if ($LASTEXITCODE -ne 0) { throw 'Stop: rotation job creation failed' }

gcloud run jobs execute $RotationJob --project=$ProjectId --region=$Region --wait
if ($LASTEXITCODE -ne 0) { throw 'Stop: rotation execution failed; do not run live demonstrations' }

gcloud run jobs executions list --job=$RotationJob --project=$ProjectId --region=$Region `
  --format='table(metadata.name,status.completionTime,status.succeededCount,status.failedCount)'
```

Secret Manager version creation and PostgreSQL commit are not a distributed transaction. Creating new secret versions does not change account passwords. Use only the exact new version numbers emitted by the fresh-generation helper, not `latest` or the exposed baseline versions `1`. Keep the new versions marked **pending** in the operator's record until the job succeeds; do not disable previous versions or hand over the new passwords before the DB result is known. If the job fails, retain the new version numbers and stop; both DB updates should roll back together. A transport failure at commit can make the outcome uncertain: inspect the job's execution result before approving any retry; never create another pair merely to work around uncertainty. If Secret Manager returned an ambiguous creation outcome or an unexpected version-reference response, inspect version metadata first to identify what was created; do not automatically rerun the generator.

After success, record only job/execution IDs, pinned version numbers and the non-sensitive user/request query above. The fresh values were checked not to match the previous hashes before replacement, and the new hashes were verified against the pinned replacement inputs before commit; therefore the previous exposed passwords no longer authenticate against those rows after successful rotation. Do not retrieve old passwords or add extra failed production-login attempts to the evidence. The isolated tests verify both old synthetic passwords are rejected and both new supplied values match. An authorized person can obtain the fresh passwords through Secret Manager's secure UI and transfer them directly to an approved password manager; never paste them into chat, screenshots, shell arguments or logs. Do not download service-account keys.

**Session caveat:** password rotation does not revoke existing stateless JWT cookies. `server/src/auth.ts` issues tokens valid for one hour. Sign out the test browsers and wait until all pre-rotation tokens have expired before relying on session invalidation, or obtain separate explicit approval for a coordinated JWT-secret version change and backend revision rollout. Browser sign-out alone does not revoke another holder's token. No JWT-secret rotation or deployment is performed by this preparation.

### 3.1 Approved retirement and failure recovery

After successful hash read-back and approved secure handoff, the owner can separately approve retiring the two exposed demo-password version-1 payloads. Database hash replacement invalidates the old passwords; disablement prevents accidental old-secret reuse. Do not disable database URL or JWT version 1, which are unrelated runtime dependencies. Do not rerun historical provisioning jobs pinned to old demo versions. No retirement command was executed here.

```powershell
$RequesterState = gcloud secrets versions describe $RequesterVersion --secret=workflow-requester-password --project=$ProjectId --format='value(state)'
if ($LASTEXITCODE -ne 0 -or $RequesterState -ne 'ENABLED') { throw 'New requester version is not enabled' }
$ReviewerState = gcloud secrets versions describe $ReviewerVersion --secret=workflow-reviewer-password --project=$ProjectId --format='value(state)'
if ($LASTEXITCODE -ne 0 -or $ReviewerState -ne 'ENABLED') { throw 'New reviewer version is not enabled' }
# Separate owner approval, after the successful rotation execution is verified.
gcloud secrets versions disable 1 --secret=workflow-requester-password --project=$ProjectId --quiet
if ($LASTEXITCODE -ne 0) { throw 'Requester version retirement failed; stop' }
gcloud secrets versions disable 1 --secret=workflow-reviewer-password --project=$ProjectId --quiet
if ($LASTEXITCODE -ne 0) { throw 'Reviewer version retirement failed; stop' }
```

Recovery checks use metadata only, never secret values or password hashes:

```powershell
gcloud secrets versions list workflow-requester-password --project=$ProjectId --format='table(name,state,createTime)'
gcloud secrets versions list workflow-reviewer-password --project=$ProjectId --format='table(name,state,createTime)'
gcloud run jobs executions list --job=$RotationJob --project=$ProjectId --region=$Region --format='table(metadata.name,status.completionTime,status.succeededCount,status.failedCount)'
```

If secret creation partially fails before job execution, keep pending IDs and stop; no database operation occurred. An owner may approve generating a fresh complete pair while recording unused pending versions, instead of retrieving values to reconstruct a pair. If commit outcome is uncertain, do not create another pair or retire old versions. Inspect the existing execution first; any explicitly approved single retry must use the exact same immutable job/image and pinned versions. The tool recognizes both already-current values without updating hashes and rejects partial reuse. Never automatically retry a known success or change configuration to bypass failure. Old-password rejection is covered for both synthetic accounts; existing JWTs remain governed by the earlier session-expiry caveat.

## 4. Evidence index and acceptance boundary

All filenames below are **proposed and not captured** by this preparation. Keep originals free of passwords, hashes, cookies, tokens and secret values.

| Proposed filename | Required content |
|---|---|
| `20-persistence-before.png` | Newly approved unique marker and actual request ID with all saved business fields before restart; Request #1 can supplement |
| `21-restart-instance-evidence.png` | Same digest/configuration, old/new ready revision and changed backend instance identifier; explain Cloud Run replacement semantics |
| `22-persistence-after-restart.png` | Same business record and safe field comparison after replacement |
| `23-automated-redeploy.png` | Successful main-only Issue 7 run, released SHA, image digest/revision record and visible change |
| `24-persistence-after-redeploy.png` | Same request and user business fields after redeployment; running version matches released SHA |
| `25-demo-rotation-result.png` | Successful one-shot rotation execution and public version IDs only; no secret contents or hashes |

Mandatory live work remains: separately approved secure rotation before login; approval for exactly one uniquely marked persistence-request creation; A baseline capture; an actual controlled restart/replacement and B comparison; an actual automatic redeploy and C comparison; and final PDF evidence packaging. No production request has been created by this preparation. Existing WIF/CI success is reused, not repeated. Optional improvement: demonstrate the reviewed rollback/rollforward procedure from the Issue 7 runbook, preserving Cloud SQL and business data. A rollback is never a database reset or a reason to restore exposed credentials.

Rotation resource impact after approval: two new active versions on existing password secrets and one short-lived Cloud Run job execution (1 CPU, 512 MiB, at most 10 minutes, no retries). No additional SQL instance or database is needed. Secret-version and job execution prices are unverified and usage-dependent; no resources or versions were created by preparation.
