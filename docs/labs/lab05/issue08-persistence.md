# Lab 5 Issue 8: Database Persistence Verification

Status (24 November 2026): **CONTROLLED REPLACEMENT AND PERSISTENCE VERIFICATION PASSED**. [Issue #41](https://github.com/tm-georgia/workflow-and-approval-system/issues/41) remains OPEN. The approved production operation and read-only comparisons are complete; Git publication, issue updates and final submission remain separately authorized work.

See the [deployment overview](deployment.md#15-issue-8-database-persistence-verification) for the compact results and submission boundary.

## 1. Acceptance result and scope

The official 01_SE_Lab_5_updated.pdf, pages 3 and 7, requires R-04/C-05: earlier data survives an application restart and automated redeployment, with before/after screenshots. The final PDF places persistence in Answer Part 3. The handout does not prescribe event order or require a database rollback demonstration.

| Requirement | Result and evidence boundary |
|---|---|
| R-04 | **FULLY SATISFIED for the demonstrated application persistence scenario:** existing Cloud SQL storage, successful database-backed reads and the original record preserved across automated redeployment and backend process replacement |
| C-05 | **FULLY SATISFIED:** Request 2 was created before both events and remains available afterward; before/after screenshots, actual revision/process evidence and nine-field API comparisons are preserved |
| Comparison scope | Exactly nine selected Request 2 business fields; no assertion that every database row/column is identical or that no unrelated actor ever wrote data |
| Restart method | Controlled same-image Cloud Run backend revision/process replacement; not an in-place restart of the identical process, a database restart, browser refresh or traffic toggle alone |
| R-09 / R-10 publication | Feature branch, issue lab5 label and assignee verified; specific teammate review, PR/CI history and board confirmation remain publication/submission tasks |
| Issue state | OPEN, assigned to thit3455, lab5; remote tasks still 0/10 checked at final read-back. All ten tasks now have evidence support locally; no checkbox or issue status was changed |

Project cpe334-workflow-approval-2026, region asia-southeast1; existing Cloud SQL workflow-db, PostgreSQL 17, database workflow. The expected attachment cpe334-workflow-approval-2026:asia-southeast1:workflow-db and persistent read connectivity were verified. No authorized public client networks were configured. No database, request, credential, IAM, billing, image or frontend configuration was modified.

## 2. Original record, comparisons and actual chronology

### 2.1 Original Request 2 and exact business fields

~~~json
{
  "id": 2,
  "title": "LAB5-ISSUE8-PERSIST-20261122T122806Z-a3b38646",
  "description": "Issue 8 persistence baseline. Keep this request PENDING and unchanged for application restart and automated redeployment verification.",
  "status": "PENDING",
  "requesterId": 1,
  "assignedReviewerId": 2,
  "reviewerId": null,
  "createdAt": "2026-11-22T12:30:00.973Z",
  "decidedAt": null
}
~~~

| Field | Original A | Fresh pre-restart R0 | After restart R1 |
|---|---|---|---|
| id | 2 | Exact match | Exact match |
| title | LAB5-ISSUE8-PERSIST-20261122T122806Z-a3b38646 | Exact match | Exact match |
| description | Full text in the JSON above | Exact match | Exact match |
| status | PENDING | Exact match | Exact match |
| requesterId | 1 | Exact match | Exact match |
| assignedReviewerId | 2 | Exact match | Exact match |
| reviewerId | null | Exact match | Exact match |
| createdAt | 2026-11-22T12:30:00.973Z | Exact match | Exact match |
| decidedAt | null | Exact match | Exact match |

The fresh execution-time GET immediately before staging also matched A and R0. The authenticated R1 GET compared all nine fields against A, R0 and that execution-time record; every comparison passed. No request was created, edited, approved, rejected, deleted or recreated.

The [pre-restart JSON](evidence/issue08-pre-restart.json), [post-restart JSON](evidence/issue08-post-restart.json) and original ignored .local/review/20-persistence-before.json have identical SHA-256 e54ba54b35320f4755cee1787bc74de1fb300764253aed39d1daf9b8536ff5bf. Matching exports support these nine business fields, not full database equality.

### 2.2 Actual chronology

| Checkpoint | Actual observation |
|---|---|
| A: 22 November 2026 | Request 2 created; original JSON createdAt 12:30:00.973 UTC and [original requester screenshot](evidence/20-persistence-before.png) preserved |
| D: 24 November 2026 | Successful automated [Deploy Main Release #5, run 45314206420](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45314206420), released SHA 44a3fdaf0e3e056bc717f64c78c18a9cea53bc05 |
| D observation | [Existing post-redeployment screenshot](evidence/Issue7_Persistence_After_Automated_Deployment.png) shows the original marker/description/PENDING/displayed creation time. It alone does not display all nine fields or establish a precise capture time |
| R0 planning checkpoint | [Fresh requester screenshot](evidence/20a-persistence-pre-restart.jpg) saved 13:03:32.172 UTC; authenticated nine-field GET observed 13:04:20.074 UTC; same-origin process/release observed 13:06:26.454 UTC |
| Execution-time baseline | Fresh GET requested 13:27:23.644 UTC and observed 13:27:49.416 UTC; all nine fields still matched A/R0 |
| Execution preflight | 2026-11-24T13:32:55.8119296Z; old active/latest-ready/latest-created revision workflow-backend-00004-sck, same image/configuration, 100% traffic and fresh process identity |
| Staged replacement | Created 13:35:30.247 UTC; verified READY/configuration match at 13:38:22.341 UTC; original revision still at 100%, candidate at 0% |
| Cutover and recovery checks | New revision at 100% with matching configuration and successful HTTP/version/privacy checks by 13:39:09.793 UTC |
| R1 | Fresh authenticated GET requested 13:40:42.448 UTC, observed 13:41:09.834 UTC; all nine fields matched A/R0/execution baseline |
| After screenshot | [Fresh post-cutover requester page](evidence/22-persistence-after-restart.jpg) saved 13:42:41.378 UTC after a new page navigation and successful data load |
| Final state | Read back at 13:45:15.699 UTC: new backend READY at 100%, same source/image, unchanged frontend/IAM, gate false |

The order is **A → D → R0 → controlled replacement → R1**. The earlier record predates both redeployment and restart. This satisfies the handout's event coverage without repeating the successful automated deployment merely to impose the original proposed A/B/C ordering.

The Issue 7 original release archive and six JSON records remain untouched in its existing ignored local review area. Existing Issue 7 deployment/release evidence is reused, not regenerated, modified or reclassified as an assistant-executed new deployment.

<a id="3-secure-demo-credential-rotation-commands-prepared-not-executed"></a>
## 3. Completed credential maintenance and security boundaries

The explicit anchor preserves the existing Issue 7 link; its old “commands prepared, NOT EXECUTED” wording is historical. Earlier approved maintenance completed demo-password rotation/handoff and login verification. Recorded execution: workflow-rotate-demo-20261122103603-shtg6; demo-password versions 2 enabled and versions 1 disabled; JWT signing-secret version 1 retained. None of those operations was repeated for Issue 8.

The public frontend and IAM-protected backend remain unchanged in access design. Only the same-image backend revision and traffic allocation changed. The internal token helper, service-scoped invocation, runtime identities, SQL attachment, secret references, port/resources/scaling and frontend/sidecar configuration were preserved.

- Backend DATABASE_URL references workflow-database-url:2 and JWT_SECRET references workflow-jwt-secret:1; no inline values or secret payloads were accessed.
- Backend port 8080, 1 CPU, 512 MiB and existing min/max settings were preserved.
- Actual service/revision specifications and operational annotations were compared in memory, excluding only the intended restart marker and control-plane identity metadata; only safe hashes/references/results were retained.
- Existing requester authentication on https://workflow-frontend-597719179612.asia-southeast1.run.app worked without another login. Cookies, tokens, Authorization headers and login payloads were not read or exported.
- The older frontend alias identifies the same service but does not share host-scoped cookies. Earlier old-alias “Please sign in” observations are historical and do not contradict the working newer-host session.
- GCP_DEPLOY_ENABLED remained false and was read back after verification. No deployment workflow was dispatched.

## 4. Executed controlled backend replacement

The user explicitly approved one staged same-image backend replacement, verified cutover and conditional traffic recovery. The following commands describe the completed operation; **do not rerun them without new authorization**.

### 4.1 Exact identity, image and traffic

| Item | Verified value |
|---|---|
| Old/recovery backend revision | workflow-backend-00004-sck |
| New active backend revision | workflow-backend-issue8-20261124-130420 |
| Before / staged / after traffic | Old 100% → old 100%, new 0% → new 100%, old 0% |
| Frontend | workflow-frontend-00002-flx, 100%; configuration and IAM unchanged |
| Released application SHA | 44a3fdaf0e3e056bc717f64c78c18a9cea53bc05, same in frontend/backend |
| Execution-time old process | cb68bdc8-3490-4112-ad0d-b2dd90998cf5 |
| New process | 4a944d9f-0494-4f5e-95b4-824b24acee5e |
| Recovery executed | No; all final checks passed |

Configured immutable index:

~~~text
asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/backend@sha256:305715ebd9e76d6b31975940420952f2eac32388db154137a71dcddccc80a93c
~~~

Resolved platform image:

~~~text
asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/backend@sha256:e8af7d686498cb4de5a49c2baba05ccf3c3530b443840c8685ca65c8b946e5dd
~~~

Both references are unchanged and match their respective OCI levels in the preserved run-5 artifact. A different index digest and platform digest are expected for this reviewed image structure; no image was rebuilt or uploaded.

Earlier planning process IDs differed through normal process replacement/autoscaling within the same revision. The actual execution baseline above was recaptured. A changed UUID alone was not treated as restart proof: the new revision, same image/configuration, explicit traffic, service recovery and persisted record together establish the demonstrated backend process replacement.

### 4.2 Commands and staged verification

~~~powershell
$ProjectId = 'cpe334-workflow-approval-2026'
$Region = 'asia-southeast1'
$OldRevision = 'workflow-backend-00004-sck'
$NewRevision = 'workflow-backend-issue8-20261124-130420'
$BackendImage = 'asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/backend@sha256:305715ebd9e76d6b31975940420952f2eac32388db154137a71dcddccc80a93c'
~~~

Actual successful staging command:

~~~powershell
gcloud run services update workflow-backend --project=$ProjectId --region=$Region --revision-suffix=issue8-20261124-130420 --no-traffic --format=json --quiet --container=backend --image=$BackendImage --update-env-vars=LAB5_RESTART_MARKER=issue8-20261124-130420
~~~

The installed CLI requires service-level options before the container selector. The first invocation rejected ordering locally with exit 2 before any API mutation. Read-back proved no candidate existed, the original runtime hash was unchanged and old traffic remained 100%; only argument ordering was corrected before the one actual revision creation. The failed parsing record is preserved locally.

The candidate was checked READY with the same platform digest. Full runtime specification, scaling/SQL/secret annotations, user release labels, frontend and IAM were verified. Only LAB5_RESTART_MARKER and revision/control-plane identity differ.

An initial strict label guard stopped before cutover because the no-traffic candidate lacked the provider-managed serving.knative.dev/route label present on the serving revision. Read-only diagnosis established identical runtime specification and operational annotations. Route/configuration-generation identity labels were then evaluated separately from actual traffic; all other configuration checks remained strict. Old traffic stayed 100% during diagnosis. No runtime setting was repaired or silently accepted, and no second candidate was created. The original guard observation is preserved.

Readiness inspection and the actual cutover:

~~~powershell
gcloud run revisions describe $NewRevision --project=$ProjectId --region=$Region --format='yaml(metadata.name,status.conditions,spec.containers[0].image,status.imageDigest)'
gcloud run services update-traffic workflow-backend --project=$ProjectId --region=$Region --to-revisions="$NewRevision=100" --format=json --quiet
~~~

The current caller's service-update and backend-runtime actAs permissions had passed read-only tests. No IAM grant was added. Before and after cutover, the exact configuration and existing IAM policies matched; actual traffic was checked independently.

### 4.3 Conditional recovery retained, not executed

The approved fallback was routing to the exact old healthy revision:

~~~powershell
gcloud run services update-traffic workflow-backend --project=$ProjectId --region=$Region --to-revisions="$OldRevision=100"
~~~

It was not needed or executed. Old traffic was simply retained during pre-cutover guards. Recovery would not restore or modify database contents. The completed approval is not standing permission for future traffic changes, cleanup, another revision or another deployment.

The old revision was retained. The non-secret marker remains on the new revision; removing it would create another change and is not part of this task. A later separately reviewed release can remove it through the existing deployment logic.

## 5. Service recovery and read-only persistence verification

| Check | Actual result |
|---|---|
| Public frontend / | 200 |
| Frontend /api/health | 200; status ok, database connected, read-only SELECT 1 through Prisma |
| Frontend /version.json | 200; full SHA matches released main |
| Frontend /api/version | Successful matching SHA/process check after cutover; final explicit HTTP 200 read-back |
| Direct unauthenticated backend /api/health | 403 |
| Frontend /_backend_identity | 404 |
| Backend revision/process | New READY revision at 100%; changed process ID; same configured index/platform image |
| Frontend / IAM / runtime settings | Unchanged |
| Authenticated GET /api/requests/mine | Fresh R1 response; exactly one matching original Request 2; all nine fields equal A, R0 and execution-time before |
| Database/request writes | None; no migrations, provisioning, seed, approval or request edit |
| Deployment gate / extra deployment | false / none |
| Conditional recovery | Not required |

The requester GET used the normal existing browser session. A unique query timestamp identified the fresh response; cached earlier JSON was not accepted. Only Request 2's nine fields were exported. No cookies, request headers, passwords, hashes, JWTs, secret payloads, HAR or raw authentication logs were collected.

Windows PowerShell comparison used the exact field set and case-sensitive comparisons; equivalent validation also parsed the JSON and checked types/values:

~~~powershell
$Fields = @('id','title','description','status','requesterId','assignedReviewerId','reviewerId','createdAt','decidedAt')
$Original = Get-Content -Raw .local/review/20-persistence-before.json | ConvertFrom-Json
$Before = Get-Content -Raw .local/review/issue8-restart-before.json | ConvertFrom-Json
$After = Get-Content -Raw .local/review/issue8-restart-after.json | ConvertFrom-Json
if (@(Compare-Object $Fields @($After.PSObject.Properties.Name)).Count -ne 0) { throw 'Expected exactly nine business fields' }
$Differences = @(foreach ($Field in $Fields) {
  if ($Original.$Field -cne $After.$Field -or $Before.$Field -cne $After.$Field) { $Field }
})
if ($Differences.Count) { throw ('Persistence mismatch: ' + ($Differences -join ', ')) }
'PASS: all nine selected Request 2 fields unchanged'
~~~

No full application test suite, build or CI deployment was rerun for this operational check. Relevant local checks cover JSON equality/types, original/new evidence hashes and image integrity, credential-pattern scan, Markdown links/anchors, command syntax, allowed Git scope and git diff --check.

## 6. Evidence index and integrity

| Evidence | Caption / actual coverage |
|---|---|
| [20-persistence-before.png](evidence/20-persistence-before.png) | Original A before both events, requester/marker/description/PENDING/displayed creation time; exact ID/nulls/UTC milliseconds from original nine-field JSON |
| [20a-persistence-pre-restart.jpg](evidence/20a-persistence-pre-restart.jpg) | Fresh R0 saved 24 November 2026 13:03:32.172 UTC; URL/REQUESTER/full marker and description/PENDING/time, corroborated by fresh GET at 13:04:20.074 UTC |
| [issue08-pre-restart.json](evidence/issue08-pre-restart.json) | Exactly nine R0 business fields, matching original A |
| [22-persistence-after-restart.jpg](evidence/22-persistence-after-restart.jpg) | Fresh page after cutover, saved 13:42:41.378 UTC; public URL/REQUESTER/original marker/description/PENDING/time; backend workflow-backend-issue8-20261124-130420 and release SHA above established by verification JSON |
| [issue08-post-restart.json](evidence/issue08-post-restart.json) | Exactly nine R1 fields from fresh GET observed 13:41:09.834 UTC; all equal A/R0/execution baseline |
| [issue08-restart-verification.json](evidence/issue08-restart-verification.json) | Machine-readable actual commands/times, old/new revisions/traffic/processes, image/source identity, HTTP/privacy results, nine-field comparisons, hashes and no-recovery result |
| [Issue 7 post-redeployment screenshot](evidence/Issue7_Persistence_After_Automated_Deployment.png) | Historical D UI observation, reused; does not alone prove hidden field equality |
| [Issue 7 deployment success](evidence/Issue7_Automated_Deployment_Success.png), [original verification JSON](evidence/issue07-final-verification.json) and [run 45314206420](https://github.com/tm-georgia/workflow-and-approval-system/actions/runs/45314206420) | Existing successful automated redeployment of the same released application; no repeat run |
| Existing ignored local review records | Original A, R0, fresh execution-time before, R1, operation/revalidation records and prepared plan; no secrets; excluded from Git |

Both new screenshots are genuine native JPEG captures at 1280 by 752 without conversion or editing. Their public URL, requester role, marker, description/status and timestamp are readable. No visible credentials or secret payloads were found. Original PNG and JSON remain unchanged.

SHA-256 integrity:

| Artifact | SHA-256 |
|---|---|
| Original PNG | d6e9061165aed242d93263d633eca82021b2f0b499fe3201265085d97004ef9d |
| Fresh R0 JPEG | cdb173e380b14b4a487e1e2414864fd5e573c1d2d03b9cdd9191f5dd2a35591a |
| R1 JPEG | 29d848a6ebe1343f19aea5e50d5af34255106cd6ecea81bce97292395e641afa |
| Original A / public R0 / public R1 JSON | e54ba54b35320f4755cee1787bc74de1fb300764253aed39d1daf9b8536ff5bf |

The old proposed 21-restart-instance-evidence.png was not captured and is not invented. The actual verification JSON supplies revision/process/command evidence; the handout's required before/after application screenshots are present. Future/proposed filenames are not linked as existing evidence.

## 7. Issue 41 checklist, acceptance and remaining publication work

All ten tasks have local evidence support. The remote checklist is still 0/10 and remains unchanged pending separate authorization.

| Task | Local evidence assessment |
|---|---|
| 1. Verify persistent Cloud SQL configuration | PASS: existing instance/database, attachment and actual database-backed reads |
| 2. Identify earlier baseline request | PASS: Request 2, original marker and createdAt |
| 3. Verify before restart | PASS: A, fresh R0 and execution-time nine-field match |
| 4. Verify restart and recovery | PASS: new same-image backend revision/process, READY/100% and recovered health |
| 5. Verify same record after restart | PASS: fresh R1 GET and after screenshot |
| 6. Verify successful automated redeployment | PASS: existing successful Issue 7 run reused |
| 7. Verify same record after redeployment | PASS: historical D UI evidence and fresh post-D exact API comparison |
| 8. Compare fields/status across stages | PASS: all nine selected fields equal A/R0/execution-before/R1; historical D screenshot's coverage stated honestly |
| 9. Collect/validate screenshots and deployment evidence | PASS: actual before/after, reused D, operation JSON, hashes and captions |
| 10. Document procedure/results in deployment.md | PASS: completed results, chronology, commands and evidence in this runbook and deployment overview |

All Issue 41 acceptance criteria are satisfied for the tested record: persistent Cloud SQL; record survives restart and redeployment; selected fields/status unchanged; evidence documented; no production business data intentionally written or reset. No claim of full database-wide equality is made.

**Operational blockers: none.** Local documentation/evidence is ready for review and publication approval. Remaining submission work: confirm project-board status (current API lacks read:project), obtain specific teammate review and required CI through the normal approved PR/release process, update the issue checklist/status only when authorized, and include the captioned persistence evidence in Answer Part 3 through the separate Issue 9 task. Issue 7's historical R-09 qualification is preserved; this task does not resolve or rewrite it.

The production verification session performed no commit, push, PR, merge or issue closure. Subsequent documentation publication is separately authorized and does not alter the preserved verification evidence. No further cloud operation is needed merely to complete R-04/C-05.
