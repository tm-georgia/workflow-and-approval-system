# Deliverable 2 Part B — F-05 local verification

Base commit `f9f032c` on `feature/f04-rejection-reason`, with uncommitted F-04 changes. The approved contract and F05-T01/T02 tests were saved before application changes.

## Initial red run

Command: `npm --prefix server test -- test/reviewer.test.ts -t "F05-T0[12]"`. See the run's `tests.log` under `.local/verification/2026-11-28T09-43-08-414Z-903e7f7d/`. PostgreSQL initialization, migrations, seed and session setup succeeded. Totals: 0 passed, 2 failed, 47 filtered skips.

- **T01, intended assertion reached.** The assigned Reviewer's PATCH with RETURNED and a valid reason failed with `expected 200 "OK", got 400 "Bad Request"`.
- **T02, fixture setup failure.** The same 400 occurred inside `createReturned()`. The owner resubmission PATCH did not run.

## Resubmission red after return became available

The same focused command ran again with the return handler and F-05 migration in place, before adding the resubmission route. T01 passed. T02 created a real RETURNED fixture, then the owner PATCH reached its intended assertion and failed with `expected 200 "OK", got 403 "Forbidden"`. The existing Reviewer router handled the unmatched path. Totals: 1 passed, 1 failed, 47 filtered skips. Log: `.local/verification/2026-11-28T09-44-21-621Z-d176cb57/tests.log`.

## Final local verification

| Command | Actual outcome |
|---|---|
| `npm --prefix server run generate` | Prisma Client generated with RETURNED and RESUBMITTED. |
| `npm --prefix server test` | 96 passed, 0 failed, 0 skipped across eight files. A previous full run timed out without a test summary. The completed rerun is in `.local/verification/2026-11-28T12-25-24-618Z-93ffb5f5/tests.log`. |
| `npm --prefix server run typecheck` and `npm --prefix server run build` | Both passed. The smoke test used this built server. |
| `npm --prefix server test -- --restricted-review --smoke` | 12 passed, 0 failed, 42 filtered skips. The separate built-server restart smoke passed. See `.local/verification/2026-11-28T12-24-20-640Z-088d3ef0/`, particularly `restricted-review-tests.log`, `saved-event.log` and `production-smoke.log`. |
| `npm --prefix client test` | 30 passed, 0 failed, 0 skipped across five files. |
| `npm --prefix client run build` | TypeScript and Vite production build passed. |
| `git diff --check` | Passed. |

**T01–T02.** The assigned Reviewer returned a pending request with HTTP 200. The owner read the trimmed reason and successfully resubmitted the original request. The server cleared current decision metadata, retained the original return event, appended the owner event and showed corrected fields in the same Reviewer's queue.

**T03.** The restricted-role HTTP smoke performed return → resubmit → return. After stopping and restarting the built server and logging in as the owner again, the full response matched the pre-restart read, including both distinct reasons and the ordered three-event history.

**T04–T07.** API/database tests covered invalid fields, access control, invalid states, competing returns and resubmissions, and rollback on forced event-write failure. The full runner exercised T07 using a temporary PostgreSQL constraint. The restricted run exercised T01, T02, T04, T05 and T06 with a non-superuser database connection.

**T08.** The UI component test exercised both workspaces with mocked API responses: blank reason, retained text after a failed return, owner prefill, validation, retained corrected fields on failure, successful retry, prior reason still visible and revised details in the Reviewer's queue.

### Runtime grants

After the F-05 schema migration, the schema owner applies `node node_modules/prisma/build/index.js db execute --config prisma7.config.ts --file prisma/grants/resubmit.sql` from the server/operations working directory. This adds column-level UPDATE for `Request.title` and `Request.description`. F-04's existing event-table and sequence grants still apply. The restricted local runner used these same SQL files.

### Local browser demo

With Docker Desktop running and local ports 3000, 4000 and 5433 available, run from PowerShell:

```powershell
Set-Location 'C:\Users\ASUS\Downloads\workflow-approval-f04'
docker compose -p f05-demo up -d --build
docker compose -p f05-demo run --rm --no-deps migrate npm run seed
Start-Process 'http://localhost:3000'
```

The separate Compose project uses synthetic local demo accounts: `requester@example.test` / `RequesterDemo334!` and `reviewer@example.test` / `ReviewerDemo334!`. Submit a purchase as the Requester. Sign in as the Reviewer and return it with the example reason. As the Requester, edit and resubmit; sign back in as the Reviewer to see the revised details. Stop the demo with `docker compose -p f05-demo down`. The Compose configuration was checked locally. Interactive browser sign-off and teammate review remain pending.

### Integration decisions

The local owner-only history read implements the approved draft. The team must still decide whether assigned Reviewers should receive a history read, and review the contract, migration and tested version before integration.

## Verification with the final example wording

The contract, API test, UI test and restart check use the requested example reason verbatim: `Please include an itemized cost breakdown in the description`. The original red-run evidence above predates this wording adjustment.

- Full server rerun: 96 passed, 0 failed, 0 skipped. Log: `.local/verification/2026-11-28T12-30-35-975Z-1443abd7/tests.log`.
- Restricted-role rerun: 12 passed, 0 failed, 42 filtered skips. Request 2 retained RETURNED event 2 with the exact reason and gained RESUBMITTED event 3. The restart check passed after a second return and a fresh owner login. Logs: `.local/verification/2026-11-28T12-30-55-199Z-2c36dd3a/saved-event.log` and `production-smoke.log` in the same directory.
- Full client rerun: 30 passed, 0 failed, 0 skipped. The server and client builds, including their TypeScript checks, passed.
