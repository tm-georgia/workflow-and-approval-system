# Part F — Sprint 1 verification

**Recorded:** 13 November 2026 (Asia/Bangkok).

**Tested implementation:** `cfa33c0ac2ede1b5afdca7cb65aeb1915fdb8d5f` (`cfa33c0`).

**Verification branch:** `feature/part-f-verification`.

**Decision:** ready for teammate review of the local implementation and verification evidence. Teammate approval, reviewed release and formal submission are not claimed.

This documentation handoff records tests and manual checks already executed on the implementation above. Creating these documents did not execute new tests or change the application. A later documentation commit must not be described as a newly tested implementation or submitted release.

## Scope and verification basis

Sprint 1 contains [F-01 Authentication](F-01-authentication.md), [F-02 Requester](F-02-requester.md) and [F-03 Reviewer](F-03-reviewer.md), under the existing [SRS](../../srs.md), [system design](../../system-sds.md), [traceability](../../traceability.md) and [Product DoD](product-dod.md). Existing requirement, feature, AC and test IDs are preserved. The [Part E verification report](verification.md) remains historical evidence; this report records Part F verification on the identified committed implementation.

The Reviewer policy is server assignment to the designated seeded Reviewer, separate from the eventual deciding identity. Review requires the assigned non-owner and a Pending request. Sprint 1 stores one final status, deciding Reviewer and decision time. Extended reasons/history and resubmission are not added by this handoff.

Evidence levels are distinguished throughout:

- **Automated API/database:** real Express/Prisma/PostgreSQL assertions in the backend suite.
- **Automated component/UI:** React tests with mocked API responses; these establish UI behavior, not database persistence.
- **Built HTTP/restart:** real HTTP against the production backend bundle and an isolated database, including application restart.
- **Supplementary real HTTP:** 30 additional executed requests through the frontend proxy to the built backend, with independent database comparisons.
- **Manual browser:** the user's actual workflow and security checks, explicitly reported as completed. They were not automated or independently observed as screenshots.

## Executed commands and results

Verified runtime: **Node 24.22.3, npm 11.19.1, PostgreSQL 18.4**. The test logs identify **Vitest 5.1.0**; the client build identifies **Vite 8.3.6**.

| Working directory | Actual command | Recorded result |
|---|---|---|
| `client` | `npm.cmd test` | Exit 0; **19 passed, 0 failed, 0 skipped**, 3 files; 3.35 s. |
| `server` | `npm.cmd run typecheck` | Exit 0; `tsc --noEmit`, no diagnostics. |
| `server` | `npm.cmd run build` | Exit 0; includes a successful typecheck and a fresh production backend bundle. |
| `client` | `npm.cmd run build` | Exit 0; `tsc -b && vite build`; 18 modules transformed. |
| `server` | `npm.cmd test -- --smoke --reporter=verbose` | Exit 0; **55 passed, 0 failed, 0 skipped**, 4 files; 3.61 s, plus **2 passing HTTP/restart smoke checks**. |

`npm.cmd` is the Windows invocation of the repository's npm scripts. The backend command includes the complete backend suite; the smoke checks are additional. There are **74 distinct passing Vitest cases**, plus 2 smoke checks and 30 supplementary HTTP request checks. Reruns and HTTP requests are not counted as additional distinct Vitest tests. No coverage percentage was measured or claimed.

[Selected actual execution output, test names and excerpts](evidence/part-f-execution.md#automated-tests-and-builds) are included in this repository handoff.

## Database isolation and persisted workflow

The existing [test runner](../../../server/scripts/test-local.mjs) creates a fresh, loopback-only PostgreSQL cluster, overrides inherited database configuration, applies migrations and synthetic seed data there, runs verification, and stops its owned cluster. Its [cleanup helper](../../../server/scripts/test-cluster-cleanup.mjs) verifies ownership metadata before stopping anything. The latest automated run logged successful shutdown.

The manual workflow and supplementary HTTP checks used a separate verification-only cluster created for Part F. Its new directory, ownership marker, live database identity and empty schema were checked before migrations/seed. No developer database was reset, migrated or seeded. No private environment file was edited. All domain records below are synthetic.

| Request | Owner | Assigned Reviewer | Initial state | Final state | Deciding Reviewer | Saved decision time (UTC) |
|---|---|---|---|---|---|---|
| #1 — Approval demo | #1 | #2 | PENDING; no decision identity/time | APPROVED | #2 | 2026-11-12T19:22:20.070Z |
| #2 — Rejection demo | #1 | #2 | PENDING; no decision identity/time | REJECTED | #2 | 2026-11-12T19:22:30.645Z |

The user submitted both requests through the actual Requester UI, decided them through the assigned Reviewer UI, then signed in as the original Requester and confirmed both final statuses, Reviewer identity and timestamps remained after reload. Independent database captures verified the Pending and final records. The supplementary authenticated owner API response matched the corrected UTC database timestamps exactly. The user also reported the Reviewer's final empty queue.

The supplementary HTTP verification refused opposite decisions on both completed records with **409**, Requester access to Reviewer operations with **403**, Reviewer access to Requester operations with **403**, and an invalid empty-title submission with **400**. Complete selected database rows and row count were unchanged after those refusals. Both roles' logout returned **204**, cleared/expired the session cookie, and subsequent protected requests returned **401**. Logout is cookie deletion under the chosen JWT design; token revocation is not asserted.

See [actual HTTP checks and database evidence](evidence/part-f-execution.md#real-http-checks) and [the captured records](evidence/part-f-execution.md#database-evidence).

## Manual browser checks and screenshot deferral

The following are **PASS by user-performed manual verification**, supported where applicable by independently executed API/database checks.

| Scenario | Feature / AC | Starting condition and actual steps | Expected and user-confirmed result |
|---|---|---|---|
| Normal workflow / S3-02–S3-06 | F-01 AC-01/03; F-02 AC-01/02/03; F-03 AC-01/02/03/04/09/10 | Original Requester signs in and submits #1/#2; assigned Reviewer approves #1 and rejects #2; original Requester signs in, inspects history and reloads. | Initial PENDING entries; final APPROVED/REJECTED entries, Reviewer #2 and decision timestamps remain after reload. Reviewer queue becomes empty. |
| Browser identity | F-01 AC-01/03 | Sign in as original Requester; inspect `GET /api/auth/me`. | REQUESTER, id 1. |
| S3-08 — forbidden operation | F-03 AC-05 | Confirm Requester identity, then open `GET /api/requests/pending`. | “You do not have permission.” |
| S3-10 — logout/protected identity | F-01 AC-04/05 | Sign out, then open `GET /api/auth/me`. | “Please sign in.” |

**Screenshot saving/inspection: DEFERRED at the user's request — NOT COMPLETED.** No screenshot is attached or claimed independently inspected. The manual message-body confirmations do not claim screenshot-visible HTTP status codes; separate actual HTTP checks establish 403/401. No signed-out screen-layout image is claimed.

An earlier `[]` browser response was not counted as Requester refusal. A role-checked manual sequence was subsequently explicitly confirmed. The earlier session's role was not independently established.

## Acceptance criteria and actual test mapping

All **22 original behavioral AC** have supporting passing verification: F-01 = 6, F-02 = 5, F-03 = 11. Planned IDs are feature-local; combined or parameterized implementation tests can cover several planned cases.

Test-file references:

- [requests.test.ts](../../../server/test/requests.test.ts): existing authentication/Requester API tests.
- [reviewer.test.ts](../../../server/test/reviewer.test.ts): real Reviewer/ownership/validation/PostgreSQL tests.
- [reviewer-rules.test.ts](../../../server/test/reviewer-rules.test.ts): permission and input-boundary unit tests.
- [App.test.tsx](../../../client/src/App.test.tsx), [RequesterEvidence.test.tsx](../../../client/src/RequesterEvidence.test.tsx) and [ReviewerWorkspace.test.tsx](../../../client/src/ReviewerWorkspace.test.tsx): component/UI tests with mocked APIs.
- [smoke.mjs](../../../server/scripts/smoke.mjs): real built-backend HTTP/restart verification.

| Feature / AC and observable outcome | Planned STS ID(s) | Actual executed test or verification | Result |
|---|---|---|---|
| F-01 AC-01 — valid credentials create a usable session | TEST-03; TEST-AUTH-ME-01; TEST-UI-01 | `requests.test.ts`: TEST-03 and TEST-AUTH-ME-01; `App.test.tsx`: TEST-UI-01; live login/cookie and manual journey. | PASS |
| F-01 AC-02 — invalid credentials create no session | TEST-02; TEST-AUTH-INVALID-01 | `requests.test.ts`: both named tests; supplementary incorrect-password and unknown-email 401, followed by /me 401. | PASS |
| F-01 AC-03 — current identity belongs to the session | TEST-AUTH-ME-01 | `requests.test.ts`: TEST-AUTH-ME-01; live identity checks for both roles; manual Requester id 1. | PASS |
| F-01 AC-04 — logout clears the cookie and identity access is refused | TEST-03 | `requests.test.ts`: logout inside TEST-03; `ReviewerWorkspace.test.tsx`: TEST-F03-UI-09; live expiry/401 and manual confirmation. | PASS |
| F-01 AC-05 — protected signed-out access is refused | TEST-01 | `requests.test.ts`: TEST-01; `reviewer.test.ts`: TEST-F03-05 and TEST-F03-SESSION; live no-cookie/post-logout 401. | PASS |
| F-01 AC-06 — Reviewer cannot use Requester-only operations | TEST-04 | `requests.test.ts`: TEST-04; live Reviewer /requests/mine 403. | PASS |
| F-02 AC-01 — valid submission is saved as Pending | TEST-01 | `requests.test.ts`: TEST-03; `RequesterEvidence.test.tsx`: TEST-F02-UI-SUCCESS; manual Pending UI and database captures. | PASS |
| F-02 AC-02 — ownership comes from the signed-in Requester | TEST-02 | `requests.test.ts`: TEST-03; `reviewer.test.ts`: TEST-F03-10-SUBMIT, including spoofed identities. | PASS |
| F-02 AC-03 — owner retrieves saved request/status | TEST-03 | TEST-03; `reviewer.test.ts`: TEST-F03-02/03/04 approval/rejection variants; `RequesterEvidence.test.tsx`: TEST-F03-UI-OWNER; manual reload and live owner retrieval. | PASS |
| F-02 AC-04 — another Requester's private record is absent | TEST-04 | `reviewer.test.ts`: TEST-F02-OWNERSHIP with a distinct authenticated Requester. | PASS |
| F-02 AC-05 — missing required fields do not save | TEST-05 | TEST-03 invalid title; four TEST-F02-VALIDATION cases in `reviewer.test.ts`; live 400 and unchanged rows/count. | PASS |
| F-03 AC-01 — eligible assigned Pending requests are listed | TEST-F03-01 | `reviewer.test.ts`: TEST-F03-01 and TEST-F03-EMPTY; `ReviewerWorkspace.test.tsx`: TEST-F03-UI-01/04; manual assigned queue. | PASS |
| F-03 AC-02 — approval saves deciding identity/time | TEST-F03-02 | `reviewer.test.ts`: TEST-F03-02/03/04 APPROVED variant; user action on #1 and independent SQL/API. | PASS |
| F-03 AC-03 — rejection saves deciding identity/time | TEST-F03-03 | `reviewer.test.ts`: TEST-F03-02/03/04 REJECTED variant; user action on #2 and independent SQL/API. | PASS |
| F-03 AC-04 — saved decision survives retrieval | TEST-F03-04 | Both combined API/database cases; TEST-F03-UI-OWNER; manual owner reload; exact SQL/API timestamps; built-app restart smoke. | PASS |
| F-03 AC-05 — signed-out/wrong-role callers cannot review | TEST-F03-05 | `reviewer.test.ts`: TEST-F03-05 and TEST-F03-SESSION; actual 401/403; manual Requester refusal. | PASS |
| F-03 AC-06 — a final decision cannot be replaced | TEST-F03-06 | Both terminal-state variants in `reviewer.test.ts`; actual opposite-decision 409 for #1/#2 and unchanged complete rows. | PASS |
| F-03 AC-07 — invalid input is rejected without mutation | TEST-F03-07 | TEST-F03-07-ID/VALUE/MISSING and TEST-F03-JSON in `reviewer.test.ts`; TEST-F03-UNIT-02/03 in `reviewer-rules.test.ts`. | PASS |
| F-03 AC-08 — simultaneous decisions have one winner | TEST-F03-08 | `reviewer.test.ts`: TEST-F03-08 observes two real blocked UPDATE sessions, then one 200/one 409 and intact winner metadata. | PASS |
| F-03 AC-09 — Reviewer actions/states behave correctly | TEST-F03-09 | All 16 cases in `ReviewerWorkspace.test.tsx`, TEST-F03-UI-01–09 and TEST-F03-UI-STRICT-01/02/03; manual decisions/empty queue. | PASS |
| F-03 AC-10 — only assigned Reviewer can review; assignment is server-owned | TEST-F03-10 | TEST-F03-01/10/10-SUBMIT/10-UNAVAILABLE/10-WRONG-ROLE; TEST-F03-UNIT-01; synthetic assignment captures. | PASS |
| F-03 AC-11 — self-owned requests cannot be reviewed | TEST-F03-11 | `reviewer.test.ts`: TEST-F03-11 after role change; `reviewer-rules.test.ts`: TEST-F03-UNIT-01. | PASS |

Ten of the 55 backend cases are [owned-cluster cleanup tests](../../../server/test/test-cluster-cleanup.test.mjs). These infrastructure checks are separate from the domain AC.

## Failures, correction and limits

Earlier sandbox PostgreSQL initialization and backend bundling attempts failed because of restricted-token/filesystem permissions. The unchanged commands subsequently succeeded in the normal permitted user context. They are not recorded as passing attempts.

The first supplementary HTTP comparison failed after ten recorded responses because the generic PostgreSQL reader treated timestamp-without-time-zone fields as local Bangkok time, shifting ISO timestamps seven hours earlier. Raw-type inspection and explicit `AT TIME ZONE 'UTC'` reads matched the Prisma API. Only local evidence-reader queries were corrected; application code and stored values were unchanged. Strict equality remained in place. A corrected 28-request run passed, followed by the final 30-request run that also checked unknown email. [Actual failure and corrected values](evidence/part-f-execution.md#timestamp-evidence-correction) are retained in this handoff.

Frontend API mocking is not persistence proof. Manual PASS records are user-attributed; screenshot inspection is deferred. Historical F-01/F-02 contract timing and Part E red/green evidence retain their existing disclosures; this report does not manufacture a pre-implementation or reviewed-release history. Existing title-length and optional legacy-backfill decisions are not promoted into new approved AC.

## Reproduction and review boundary

Use the existing [README](../../../README.md), [feature contracts](F-03-reviewer.md) and tracked test/smoke scripts. Run the commands above with a compatible Node runtime and PostgreSQL tools. Use the isolated backend runner rather than a developer-database connection. The supplementary HTTP table is retained execution evidence, not a new permanent test suite or a machine-specific helper to install.

The teammate should review the AC mappings, actual assertions/output, assignment/self-approval and Pending-only guarantees, owner privacy/persistence, UI regression evidence, failure disclosure and manual/automated distinctions. Two [actual executed test excerpts](evidence/part-f-execution.md#actual-executed-test-excerpts) support focused review.

**Local technical verification is ready for teammate review.** Screenshot inspection and PDF preparation are explicitly deferred. Substantive teammate approval, selected Issue/PR/integration/contribution evidence and an identifiable reviewed release remain formal completion gates. No remote approval, PR, merge, submitted release or contribution is fabricated. Re-run the required verification on the eventual submitted release if its commit changes.

AI assistance: Codex inspected local requirements/code/test evidence, executed the recorded automated/API checks, diagnosed the local timestamp reader, and prepared this handoff. The user performed and confirmed the actual browser workflow/security checks. This does not claim participation or approval on behalf of either student.

This handoff adds documentation only. Existing implementation, tests, Part E documentation, environment files and ignore rules are unchanged. No PDF, commit, push, PR or merge was created while preparing it.
