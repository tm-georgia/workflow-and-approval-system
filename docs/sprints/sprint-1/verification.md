
# Part E - Local Implementation and Verification Report

## Latest status — 28 November 2026

The original verification sections below record the Sprint 1 implementation and verification history from 12–13 November 2026. Their dates, test counts, working-tree details, and Git status describe those historical checkpoints and have not been rewritten.

CHG-001 — Requester History Recovery — was subsequently implemented, reviewed, and merged into `sprint-staging` through PR #52 on 28 November 2026 (merge commit `5328f22`).

CHG-001 verification was completed separately:

- 27 client tests passed across 4 test files.
- The production client build completed successfully.
- Browser verification confirmed that a successful request submission remains acknowledged when the subsequent history GET fails.
- The UI displayed a separate history-refresh warning.
- After history retrieval was restored, the Requester successfully retried; the request history updated and the warning disappeared.
- The retry did not submit another POST request.

These results are a separate verification run from the earlier 55 backend and 19 frontend test results. They must not be combined into a single test count.

The PR confirms integration into `sprint-staging`. Final release verification on `main` remains a separate step.

---

## Original Sprint 1 verification history

**Date:** 12 November 2026 (Asia/Bangkok). **Branch:** `feature/F-03-reviewer`. **Base commit:** `4326e6e`, plus the uncommitted working-tree changes listed below. No commit, staging, push, merge, rebase, PR, Issue, or remote update was performed at that historical checkpoint. This is local engineering evidence, not an accepted release.

**Outcome:** local Sprint 1 implementation, contracts, tests, builds, and documentation are complete for teammate review. **Part E is not yet ready to claim formal submission acceptance:** teammate review, versioned engineering history, and integration/release evidence remain pending. Existing retrospective F-01/F-02 documentation is disclosed; this task does not manufacture a contract-before-code history.

## Latest verification - three final-review corrections

**12 November 2026 correction verdict: READY FOR TEAMMATE REVIEW.** All three reported findings have been corrected locally. This supersedes the earlier 45/15 verification counts below, which are retained as historical evidence. Formal submission review/history/integration gates remain pending; no Git submission or developer database/configuration changes were made.

| Finding | Correction | Actual verification |
|---|---|---|
| Obsolete pending-list responses | A monotonically increasing load generation guards data, error, and loading callbacks. Effect cleanup and decision start invalidate outstanding GETs, including StrictMode replay. | Four new StrictMode cases first failed against the old implementation (12 existing Reviewer cases still passed). After correction, all 19 frontend tests passed, including old successes arriving after approval/rejection, obsolete errors, and older GETs finishing during a newer refresh. |
| Cleanup after failed/timed-out startup | Record the attempt before invoking pg_ctl. Cleanup checks the current run's canonical root/data directory, unique ownership marker, PID-file data directory, positive PID, and expected ephemeral port before invoking pg_ctl against that exact directory. It waits briefly for startup metadata; ambiguous/foreign metadata is refused, never guessed. | Ten cleanup safety unit cases passed. A real `--check-startup-timeout` run used `pg_ctl -w -t 0`: startup returned status 1 with `server did not start in time`; the failure path then logged `server stopped` for its owned cluster. |
| Genuine concurrent database operations | A third connection holds the request row lock. The test starts opposite decisions and polls PostgreSQL's direct/indirect blocking graph until it observes two distinct active UPDATE sessions waiting. It releases the lock only after this assertion and always rolls back/releases/drains/closes in `finally`. | The complete backend run logged the two-session barrier observation, then verified exactly one `200`, one `409`, and intact winner status/identity/time. No application authorization or decision code was weakened or changed. |

### Current executed results

All Node commands used `../.local/node-runtime/node_modules/node/bin/node.exe` (**24.15.0**) from the listed package directory.

| Directory | Command after Node executable | Actual result |
|---|---|---|
| `client` | `node_modules/vitest/vitest.mjs run --reporter=json --outputFile=../.local/verification/corrections-frontend-green.json` | **19 passed, 0 failed, 0 pending**, including the original Requester journey. |
| `server` | `scripts/test-local.mjs --smoke --reporter=verbose` | **55 passed, 0 failed, 0 skipped; 4 files passed**. Started 23:20:13 Bangkok; test duration 6.88 seconds. Both real HTTP/application-restart persistence smoke checks passed. Harness exited 0 and stopped its owned cluster. |
| `server` | `node_modules/typescript/bin/tsc --noEmit` | Exit 0; no TypeScript errors. |
| `client` | `node_modules/typescript/bin/tsc -b` | Exit 0; no TypeScript errors. |
| `server` | `scripts/build.mjs` | Exit 0; fresh backend production bundle generated before the successful HTTP smoke run. |
| `client` | `node_modules/vite/bin/vite.js build` | Exit 0; production assets built, 18 modules transformed. |
| `server` | `scripts/test-local.mjs --check-startup-timeout` | Expected diagnostic exit **1**, because startup was deliberately given zero wait time. The start-failure cleanup succeeded. This is an intentional fault-injection result, not a failing application test or an exit-0 claim. |

Current total: **74 passing automated tests**, plus the HTTP/restart smoke checks. Backend = six unchanged original regressions + 36 Reviewer/ownership/validation cases + three rule tests + ten cleanup safety cases. Frontend = original Requester journey + 12 previous Reviewer cases + four new StrictMode cases + two Requester evidence cases. The new `.mjs` cleanup unit tests execute under Vitest; the TypeScript command checks the project's TypeScript sources/configured tests as before.

### Current evidence and exact correction scope

- Complete backend run: `.local/verification/2026-11-12T16-20-03-730Z-498d78af/`. Inspect `tests.log` for the actual blocking-graph barrier observation and 55 passing tests, `production-smoke.log` for both PASS lines, and `stop.log` for shutdown.
- Actual startup-timeout exercise: `.local/verification/2026-11-12T16-21-39-448Z-df4303f2/`. `start.log` records the intentional timeout; `stop.log` records successful shutdown. No migrations/application tests were run in that diagnostic cluster.
- Frontend correction red/green: `.local/verification/corrections-frontend-red.json` (**12 passed, 4 failed**) and `corrections-frontend-green.json` (**19 passed, 0 failed**).
- Current typecheck output: `.local/verification/corrections-server-typecheck.log` and `corrections-client-typecheck.log` (both successful with no diagnostics). Build results above were observed directly; the older build-log paths below belong to the earlier checkpoint.
- The previous complete report/source manifest is retained locally at `.local/verification/pre-corrections-verification.md`.

Exactly **nine files** were changed by this correction task; the complete working-tree set now contains **35** changed/untracked source/document files relative to base commit `4326e6e` (the earlier set had 33):

```text
client/src/ReviewerWorkspace.tsx
client/src/ReviewerWorkspace.test.tsx
server/scripts/test-local.mjs
server/scripts/test-cluster-cleanup.mjs          (new)
server/test/reviewer.test.ts
server/test/test-cluster-cleanup.test.mjs        (new)
docs/sprints/sprint-1/F-01-authentication.md
docs/sprints/sprint-1/F-03-reviewer.md
docs/sprints/sprint-1/verification.md
```

The contract edits retain IDs and update STS descriptions/results/history; F-01 implementation and the original backend/frontend regression test files remain unchanged. No migration, dependency, auth, Requester API, or decision-route production code changed in this correction. No unresolved blocker remains for the three findings. Review/integration, historic retrospective-contract disclosure, optional legacy backfill/title-length policy, later-sprint approval, and submission packaging remain the existing team responsibilities described below.

## Authority and resolved design

Read the teacher's local `project_deliverable_1_v1.pdf`, section 3.5 (Part E), and `group_project_spec_files.zip` -> `group_work_specs_v1.pdf`, section 6 Theme 5. These sources are in `C:/Users/ASUS/Downloads/`, outside the repository; no newer instruction was found in the workspace. The group PDF labels itself a draft, so the team should retain/confirm the applicable instructor revision.

Part E requires linked FR/BR/NFR, feature design and applicable UI/API/data definitions, testable stable AC, STS with levels/inputs/actions/outcomes, Product DoD, and honest specification/test/implementation history. Theme 5's Sprint 1 example requires assigned/authorized review, a recorded decision/history entry, invalid-transition refusal, self-approval prevention, and tests for unrelated Reviewer access and Requester misuse of review operations.

The user explicitly approved one designated seeded Reviewer assigned by the server to every new request. Implementation persists separate `assignedReviewerId`; the existing `reviewerId` still means the deciding Reviewer. Missing/wrong-role designated accounts cause submission to fail safely with `503`. Unassigned legacy records are not reviewed or automatically backfilled. BR-05/BR-06 were added without renumbering prior requirements.

Sprint 1's minimum decision/history entry is final status, deciding identity, and decision time, saved once together and retrieved by the owning Requester. The teacher's Sprint 1 example does not explicitly require extended reasons, return/resubmission, or a multi-event history. The team baseline revision on 13 November allocates F-04/F-05 to Sprint 2 and F-06/F-07 to Sprint 3. Those features remain planned, not implemented; see docs/sprints/plan.md.

## Completed requirements and engineering work

| Area | Completed locally and verified | Acceptance still pending |
|---|---|---|
| F-01 / FR-01, NFR-01/NFR-02 | Existing auth implementation and six backend tests retained; latest identity assertion rerun successfully. Original Requester UI journey retained and passed. Contract execution addendum added. | Teammate review; acknowledge the contract was retrospective. |
| F-02 / FR-02/FR-03, BR-01/BR-02, NFR-01-NFR-03 | Requester submission/list preserved; server assignment integrated; success feedback and decision metadata display added. Ownership, spoofed identity, invalid required values/no-save, and UI checks executed. Missing API/data/STS/dependency/history documentation completed. | Teammate review of bounded changes; title-length policy remains a disclosed optional product-rule decision. |
| F-03 / FR-04-FR-06, BR-03-BR-06, NFR-01-NFR-03 | Assigned pending list, approve/reject, session role/identity, explicit assignment and self-owner checks, validation/safe errors, persisted decision, owner retrieval, repeated/concurrent refusal, and working Reviewer UI. | Teammate review, integration, and accepted release. |
| Part E contracts | F-01/F-02/F-03 contain applicable design, requirement links, AC/STS/DoD and honest history. Shared Product DoD, baseline design/rules, traceability and stale plan references reconciled. | Versioned review history and submission assembly by the team. |
| Reproducibility and data safety | README, backend typecheck/build/run scripts, additive assignment migration, isolated PostgreSQL test harness, production-bundle HTTP/restart smoke check, and actual results/logs. | No developer database configuration/migration or legacy backfill was performed. Deployment is a Lab 5 responsibility. |

All F-03 AC-01-AC-11 have actual local verification, detailed in [the F-03 STS](F-03-reviewer.md). Existing F-02 AC-01-AC-05 and F-01 AC-01-AC-06 retain their IDs and are mapped to actual tests in their contracts. Cross-Requester privacy is tested through `/mine`, the real available API; no nonexistent request-detail endpoint is invented.

## Initial verification results before the final-review corrections

Initial verified runtime: **Node 24.15.0**, TypeScript 7.0.2, Vitest 5.1.0, PostgreSQL 18.4, Prisma 7.10.1. The compatible Node executable was installed only under ignored `.local/node-runtime/`; the machine's Node 24.14 installation was not replaced. Current correction results appear above.

The commands at this earlier checkpoint used `../.local/node-runtime/node_modules/node/bin/node.exe` from `server` or `client`. Reproduction with a compatible Node on PATH uses the equivalent npm commands in README. Output redirection saved full logs under `.local/verification/`.

| Working directory | Actual command after the Node executable | Result |
|---|---|---|
| `server` | `node_modules/typescript/bin/tsc --noEmit` | PASS, exit 0. Checks server, tests, seed, and Vitest config. |
| `server` | `scripts/build.mjs` | PASS, exit 0; production ESM bundle generated. `npm run build` (typecheck then bundle) also passed earlier. |
| `server` | `scripts/test-local.mjs --smoke --reporter=verbose` | PASS, exit 0: **45 tests passed, 0 failed, 0 skipped; 3 files passed**; plus the two built-server smoke checks below. Final suite began **13:32:59 Bangkok**, duration **6.05 seconds**. |
| `client` | `node_modules/vitest/vitest.mjs run --reporter=json --outputFile=../.local/verification/frontend-green.json` | PASS, exit 0: **15 tests passed, 0 failed, 0 pending**. Includes the unchanged original Requester journey. |
| `client` | `node_modules/typescript/bin/tsc -b` | PASS, exit 0. |
| `client` | `node_modules/vite/bin/vite.js build` | PASS, exit 0: 18 modules transformed, built client assets. `npm run build` (typecheck then Vite) also passed earlier. |
| Repository | `git diff --check` | PASS; no whitespace errors. Git's LF/CRLF notices are line-ending conversion notices. |

Backend breakdown: six unchanged original authentication/Requester tests; 36 Reviewer, assignment, access, ownership, validation, and error cases; three pure rule tests. Frontend breakdown: one unchanged original Requester journey; 12 Reviewer cases; two Requester success/decision-metadata cases. There are **60 passing automated tests in total**; the smoke checks are additional checks, not included in that count.

Built HTTP server smoke output:

```text
PASS: built HTTP server login -> submission -> assigned list -> forbidden Requester decision -> approval -> repeated-decision refusal.
PASS: saved decision identity/time and owner retrieval survive a built application restart.
```

The smoke script runs the actual compiled backend on a free loopback port, authenticates synthetic users over HTTP, uses real PostgreSQL, stops/restarts the application, and compares saved status/Reviewer/time on owner retrieval. It is not a browser end-to-end test or a cloud redeployment demonstration. Frontend tests simulate API responses and are not presented as database-persistence evidence.

## Initial checkpoint evidence locations

These are ignored local artifacts retained for inspection, not committed submission artifacts:

- Final backend run: `.local/verification/2026-11-12T06-32-50-063Z-de76aa7f/` with `migrations.log`, `seed.log`, `tests.log`, `production-smoke.log`, `http-server.log`, and `stop.log`.
- `tests.log` ends with `Test Files 3 passed (3)` and `Tests 45 passed (45)`; `stop.log` records `server stopped`.
- Final frontend: `.local/verification/frontend-green.json` and `frontend-green.log`.
- Type/build checks: `.local/verification/server-typecheck.log`, `server-build.log`, `client-typecheck.log`, `client-build.log`.
- Backend red: `.local/verification/2026-11-12T04-41-46-956Z-54c57e52/tests.log`.
- Frontend red: `.local/verification/frontend-red.json` and `frontend-red.log`.

The harness always supplies a newly initialized cluster's connection URL and an ephemeral random JWT secret to child processes. It does not edit the developer's `.env`; explicit environment overrides prevent child processes from taking their database target/JWT secret from developer configuration, while existing dotenv imports remain unchanged. It never drops/resets/deletes an existing database. The original regression's test-record cleanup is confined to this isolated cluster. Each successful run stopped its temporary server and retained the data directory; the first Windows startup experiment was also explicitly stopped. The normal database already listening on port 5432 was not used.

## Real red/green sequence and earlier failures

F-03's assignment/self-approval/minimum-history resolution was written into its local contract before backend/UI implementation. Then actual tests ran against the missing behavior:

| Stage | Observed result | Meaning |
|---|---|---|
| Backend before routes/assignment | **27 failed, 6 passed** (33 tests). Missing Reviewer routes returned `404`; submission returned an unassigned row; missing designated Reviewer still allowed saving. | Genuine behavior failures, not an import-error-only red run. All six original regressions passed. |
| Reviewer UI before replacement | **12 failed, 0 passed** in the selected Reviewer suite. The placeholder lacked details/actions/states. | Real assertions failed against the existing UI. |
| First implemented suite | **43 backend / 15 frontend passed**; builds passed. | Rules/UI implemented without disabling required assertions. |
| Initial supported-runtime suite | **45 backend / 15 frontend passed**, plus built-server restart smoke. | Added invalid/expired/unknown-user sessions and wrong-role designated-account checks; made the invalid-array case explicit. |
| Subsequent final-review corrections | **55 backend / 19 frontend passed**, plus built-server restart smoke and successful cleanup after intentional startup timeout. | The four new StrictMode cases first failed; generation guards fixed them. Added cleanup safety cases and strengthened observed-overlap concurrency coverage. Current results/logs are indexed at the top of this report. |

The suite grew after the initial red run; it is not claimed that all 45 final tests existed at the first checkpoint. No assertion was weakened to conceal missing behavior. Local snapshots/logs preserve observed ordering, but no immutable red/green commits were created because the user prohibited Git submission.

Environment failures were resolved and are not reported as passing tests: sandbox npm/cache/network access initially failed; Windows PostgreSQL restricted-token startup required permission; the initial startup capture inherited a background output handle and was corrected to use file handles; esbuild required permitted filesystem access. Node 24.14 produced jsdom engine warnings; final tests/builds were rerun with local Node 24.15. Intermediate startup/build failures are distinct from the final successful verification above.

## Selected actual test assertions

Concurrency, from `server/test/reviewer.test.ts` (`TEST-F03-08`), executed successfully:

```typescript
resultsPromise = Promise.all([decide(reviewer, pending.id, "APPROVED"), decide(reviewer, pending.id, "REJECTED")]);
// After independently observing both blocked UPDATE sessions:
expect(waitingPids).toHaveLength(2);
await blocker.query("COMMIT");
locked = false;
results = await resultsPromise;
expect(results.map((response) => response.status).sort()).toEqual([200, 409]);
const winner = results.find((response) => response.status === 200)!;
const saved = await prisma.request.findUniqueOrThrow({ where: { id: pending.id } });
expect(saved.status).toBe(winner.body.status);
expect(saved.reviewerId).toBe(reviewerId);
expect(saved.decidedAt?.toISOString()).toBe(winner.body.decidedAt);
```

Unrelated Reviewer access, from the same file (`TEST-F03-10`), executed successfully:

```typescript
const pending = await createPending();
const list = await unrelated.get("/api/requests/pending").expect(200);
expect(list.body.map((item: { id: number }) => item.id)).not.toContain(pending.id);
const denied = await decide(unrelated, pending.id).expect(403);
expect(denied.body).toEqual({ error: expect.any(String) });
expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
```

## All changed files

Paths below are relative to the repository. The user's F-03 draft was already untracked before this task and has been expanded in place. Existing F-01 auth code and the teammate's original backend/frontend test files were not rewritten.

```text
.gitignore
README.md
client/src/App.css
client/src/App.tsx
client/src/RequesterEvidence.test.tsx
client/src/ReviewerWorkspace.test.tsx
client/src/ReviewerWorkspace.tsx
docs/features.md
docs/sprints/plan.md
docs/sprints/sprint-1/F-01-authentication.md
docs/sprints/sprint-1/F-02-requester.md
docs/sprints/sprint-1/F-03-reviewer.md
docs/sprints/sprint-1/product-dod.md
docs/sprints/sprint-1/verification.md
docs/srs.md
docs/system-sds.md
docs/traceability.md
server/package-lock.json
server/package.json
server/prisma/migrations/20261112000000_reviewer_assignment/migration.sql
server/prisma/schema.prisma
server/scripts/build.mjs
server/scripts/smoke.mjs
server/scripts/test-local.mjs
server/scripts/test-cluster-cleanup.mjs
server/src/app.ts
server/src/index.ts
server/src/requests.ts
server/src/reviewer-rules.ts
server/src/reviewer.ts
server/test/reviewer-rules.test.ts
server/test/reviewer.test.ts
server/test/test-cluster-cleanup.test.mjs
server/tsconfig.json
server/vitest.config.ts
```

Generated dependencies, Prisma client, bundles, temporary Node runtime, synthetic test data, and execution logs are ignored outputs, not source-file submissions. No `.env` file was created or modified.

## Remaining decisions, limitations, and submission readiness

- **No unresolved F-03 implementation/design blocker remains.** The specific assignment decision was asked and answered before implementing it; explicit self-approval prevention and atomic updates are in place.
- **Teammate review remains required**, particularly for the assignment integration in Requester submission, shared API error handling, the additive schema, and contract updates. Existing F-01 middleware and original tests are preserved.
- **Git submission/integration is pending explicit user approval.** Record genuine reviewed contract/code/test history, Issue/PR links, staging integration, and accepted release references through the team's process. No IDs, approvals, participation, or release claims are fabricated here.
- **F-01/F-02 contract history is retrospective.** Preserve that disclosure and discuss any assessment concern with the instructor. A new document revision cannot recreate a prior contract-before-code sequence.
- **Legacy assignment/backfill is optional and requires separate approval.** Old records remain unassigned and inaccessible to Reviewers. Private developer configuration and migration/demo setup must be performed for the team's chosen development database; this task tested only isolated databases.
- **Title-length policy needs teammate agreement.** The existing UI maximum of 120 is retained; API checks non-empty strings. No teacher-imposed maximum is asserted. This is disclosed without silently adding a new product rule.
- **Later-sprint features are planned, not implemented.** The 13 November baseline revision allocates reasons/history and return/resubmission to Sprint 2, and filtering/reporting to Sprint 3. Their detailed contracts and tests are required before implementation.
- **Submission packaging is still needed.** Include the complete contracts, STS, shared Product DoD, actual evidence and honest history in the assessed PDF, with the team's real names/contributions, page references, and eventually the submitted version. No PDF or Git submission was requested/performed in this local implementation task.

**Readiness verdict:** ready for local teammate review; not yet ready to claim all formal Part E acceptance/review/history/integration gates are satisfied. See [Product DoD](product-dod.md).

AI assistance in this local task: Codex reviewed the specified local documents/teacher materials, requested the unresolved assignment decision, implemented bounded Reviewer work, added/executed tests, and reconciled documentation. The team remains responsible for reviewing and understanding the result.

## Tested source snapshot

The SHA-256 manifest below identifies local implementation/test/configuration bytes after the final-review correction verification (55 backend/19 frontend passing). Documentation and this report are excluded from the hash manifest to avoid a self-referential hash. Base commit alone does not identify this uncommitted tested version. These hashes supplement local evidence; they are not a signed release or a replacement for reviewed Git history. The preceding checkpoint's manifest is retained with the local pre-corrections report.

| File | SHA-256 |
|---|---|
| `.gitignore` | `4e95afa045f959db99786f52f8ef25531acc15a670c1cbe7e02f836744a05437` |
| `client/package-lock.json` | `043d8e31cea698264062b510fcc7d5a64df71bc63feb47b20fae5ce7145af709` |
| `client/package.json` | `c4ce336ab6d95b1a586e92b466a5719b7ee0d3e64b916dbe89afcdc2e8821bfc` |
| `client/src/App.css` | `1ea9399fda16157aa070ac8b487f74a4f5576dc307ffff14fbed8038184211c1` |
| `client/src/App.test.tsx` | `12b58fa4560f3cbb1cec10b94b363ab5e222a5a45e3e3e6d88ed34f4d9776001` |
| `client/src/App.tsx` | `c2a44046d25ba908592f531873e0958bf74ff6e9cb9b1afbc544e1e7cc040ca5` |
| `client/src/RequesterEvidence.test.tsx` | `703e8f3392b075ef568de17d4174bd54b9c029761d1b9b66b01a569177c6d423` |
| `client/src/ReviewerWorkspace.test.tsx` | `39885733ae2310e827e6ec2050924da659362bede46644269afadf86efcb5dd1` |
| `client/src/ReviewerWorkspace.tsx` | `b5ea511fe0bb2999d65d53958ff7bfdfb507a327f5425b404f40b6f0fc4eea58` |
| `client/src/index.css` | `5fbfd1a31f47b772a2b90b54c4e8312e8d874ae7d994590a93c191cde97873d0` |
| `client/src/main.tsx` | `484f93f3048565a86a47e308f5a12ee27aa12f5291f3b52a4bb5dc03d887dbc7` |
| `client/src/test/setup.ts` | `5927707a1b5da96dff2104f2e7f2bfcac03a53504e3ecddb48aefff07f3c6aba` |
| `client/tsconfig.app.json` | `bbcd078c923aa26585b32222f966a047948210372f3adbf41617e7553ef73e13` |
| `client/tsconfig.json` | `ad28d132ee48d6e23917cf5827cace785d0fc01a44ca68b0dda51cc8c3fd3f52` |
| `client/tsconfig.node.json` | `a9e6c7f6fd3ec455a6fe1d4fbb83091e774b62fe116008ab6d8c5e1e88af4629` |
| `client/vite.config.ts` | `ddff6eedd1a90bbc4c1b1ce23cc72a7ad0c5ba262c3f2a01f7241ea09cc4e3f0` |
| `server/package-lock.json` | `29d0659494abd4f51c990fe28c089433ed06e35ac332f9ea0604e4949ee9c7f1` |
| `server/package.json` | `db9901609d983855fa753f8df22bf5a2c1ad5259190f813436cb6f01fab1ba37` |
| `server/prisma/migrations/20261107063128_init/migration.sql` | `4be0b122e557d61c58e6acd26de590d4386e081646327160ce88b755be33a65e` |
| `server/prisma/migrations/20261112000000_reviewer_assignment/migration.sql` | `669610ddb9cf4352ca02d257d8507b64758759b20674c3979002d29ff999301a` |
| `server/prisma/migrations/migration_lock.toml` | `bc487c02c71ad9cae8694647129e3ea7f32b1fe7007d0a6ced064e51022cd3fb` |
| `server/prisma/schema.prisma` | `dfaa4871e454d29740b3f56578dce2f8b7a26cfea475701efae3363ab6d6fa5e` |
| `server/prisma/seed.ts` | `627b728a29f0d6b0bacb92f97e2202a2ca326267553e36eb4afc1600a658c32c` |
| `server/prisma7.config.ts` | `b8c30b02f98f6c61c5d2387bcde085a28126aaea9a13ef2e035a1bbbf547ed60` |
| `server/scripts/build.mjs` | `e6e999ce1c496b5b85f47fb754b2cc6ed536dfa18c7d124e7651f6a4f35f610d` |
| `server/scripts/smoke.mjs` | `d0002b0f1f3b90a65e996ca45fbbb436d0d31b6ca9db50062b45747b4e488b0e` |
| `server/scripts/test-cluster-cleanup.mjs` | `9b9fb5ec636366074fc127cefb713b680a45abbf1245a0a450844330ca430700` |
| `server/scripts/test-local.mjs` | `f6d5c7ad20b8023c92513bc893a079fb5e6675f5d859c5712ff10d9f2e0f4a30` |
| `server/src/app.ts` | `c76838257469d6e3981915548c5cb8253a80fcf332440ea9bcb8e6b85bc05f90` |
| `server/src/auth.ts` | `a1aca3599b3fcb566b1598587ccb956b8478c86d733b3c1771bda638d8c3f203` |
| `server/src/index.ts` | `918682c961c760e41b81da56ef53b8beb0de574ea909727a8645ed746cd82937` |
| `server/src/prisma.ts` | `c7b93bdc105b29ea7b7e732c18114a5101d27487140b014b3f03cf7164304361` |
| `server/src/requests.ts` | `68e7c9e322f31dd7daa5c6fd5a0980c6edff2592b10a8aaaa704e025d47fc3a3` |
| `server/src/reviewer-rules.ts` | `87f3693d491fb77f35e0aafda343108fa2cfb027206167209cf547673708cf1f` |
| `server/src/reviewer.ts` | `9c91adcaca3ac89f26c0014654eb4698e15126714a93b26b1c50e4e9b69e494e` |
| `server/test/requests.test.ts` | `b3752247ba2021639f3bf27306a28a0288fbcebd5bb016ac15802122b9488f4f` |
| `server/test/reviewer-rules.test.ts` | `31f0df6258e1fce0a4a8bbdbc1968827ebc598bd2dd23ea3713e6cdfd82d81dc` |
| `server/test/reviewer.test.ts` | `0b404a1b67d1aaa04b2f6bb194ba81c2b7ebe1e9e1a88f6ff1710c9373852058` |
| `server/test/test-cluster-cleanup.test.mjs` | `d19fa9f22fd0d27fa1d4ce92fc442895b6aa109a1d446f9d03d35c3340be3786` |
| `server/tsconfig.json` | `2578866835799eb41130382c3469a1462a0438b41a4f216bf2b3aba5e9039075` |
| `server/vitest.config.ts` | `acdb291cd826eb4e647510ed79314b66c9596111fa944f69b7b7ae8a6b6a7b97` |

## Post-integration status — 13 November 2026

The available Git history at that historical checkpoint showed F-03 merged into `sprint-staging` through PR #11 and the Part F verification handoff merged through PR #13. This report's test results describe the recorded local verification run; rerun the required checks on the final release commit. The 13 November SRS, feature inventory, traceability, system design, and sprint plan align decision reasons/history with Sprint 2 F-04 and preserve the Sprint 1 F-03 behavior. A staging-to-main release was not recorded in the inspected local Git history.

---

## CHG-001 — Requester History Recovery

**Verification date:** 28 November 2026

CHG-001 was implemented, reviewed, and merged into `sprint-staging` through PR #52 (merge commit `5328f22`).

### Verification results

- 27 client tests passed across 4 test files.
- The production client build completed successfully.
- Browser verification confirmed that successful request submission remains acknowledged when the subsequent history GET fails.
- A separate history-refresh warning appeared.
- After history retrieval was restored, the Requester successfully retried the history request.
- The request history updated and the warning disappeared.
- The retry did not submit another POST request.

These results are separate from the historical Sprint 1 results of 55 backend tests and 19 frontend tests. The counts must not be combined.

### Integration status

PR #52 was merged into `sprint-staging`. Final release verification on `main` remains a separate step.
