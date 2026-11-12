
# F-03 — Reviewer Decision Workflow

## 1. Feature summary

F-03 allows an authenticated Reviewer to view requests waiting for a decision and approve or reject a Pending request.

The system saves the decision status, Reviewer identity, and decision time in PostgreSQL. A Requester can later see the updated status of their own request.

**Implementation status:** Implemented and locally verified on 12 November 2026. See [verification.md](verification.md) for executed results, runtime, working-tree identity, and red/green evidence. Teammate review, versioned submission, integration, and release acceptance remain pending.

## 2. Linked requirements

- FR-04 — View requests for review
- FR-05 — Decide request
- FR-06 — Save decision
- BR-02 — Request ownership
- BR-03 — Reviewer permission
- BR-04 — Pending-only decision
- BR-05 — Assigned Reviewer (user-approved local policy)
- BR-06 — No self-approval (Theme 5 rule)
- NFR-01 — Protect signed-out users
- NFR-02 — Protect role and ownership access
- NFR-03 — Persist saved requests and decisions

## 3. Dependencies

- F-01: Authentication and current-user identity
- F-02: Request submission and status tracking
- PostgreSQL and Prisma database
- Existing Requester and Reviewer accounts

## 4. Feature design

1. A Reviewer signs in.
2. The Reviewer opens the Reviewer workspace.
3. The system retrieves only non-self-owned requests assigned to the authenticated Reviewer with status `PENDING`.
4. The Reviewer selects a request.
5. The Reviewer chooses Approve or Reject.
6. The backend verifies authentication, Reviewer role, assignment, non-self-ownership, and request status.
7. The backend saves the new status, Reviewer ID, and decision timestamp together.
8. The UI refreshes the pending-request list.
9. The Requester can see the updated status in their own request history.

Only requests with status `PENDING` may receive a decision. An already approved or rejected request cannot be decided again.

### Design resolution recorded before implementation - 12 November 2026

The user approved server assignment of every new request to one designated seeded Reviewer. `DESIGNATED_REVIEWER_EMAIL` optionally selects that account; the local demo default is `reviewer@example.test`. Submission looks up that account and requires its current role to be `REVIEWER`; if unavailable, return `503` without saving a request. Clients cannot choose assignment or decision identity.

Add nullable `Request.assignedReviewerId` with a distinct User relation and an assignment/status index through an additive migration. Existing records remain unassigned; no automatic backfill or reassignment is authorized. Reviewers cannot list or decide unassigned records or records assigned to someone else. Re-check assignment in the conditional database write. Explicitly refuse self-approval (`requesterId === authenticated Reviewer ID`) even if a role changed after submission.

The minimum Sprint 1 decision/history entry is the request's persisted status, deciding `reviewerId`, and `decidedAt`, saved together once. The successful decision response and the owning Requester's existing `/api/requests/mine` retrieval expose this entry; the Requester UI shows status and available decision metadata. No separate event log, reasons, return, or resubmission is introduced. Extended history/reasons remain proposed F-04/F-05 scope.

Implementation will use the drafted GET/PATCH paths below. Return `403` for an existing inaccessible/self-owned record, `404` for a missing record, and `409` for an accessible record that is no longer pending. No forbidden response contains private request details.

## 5. UI specification

The Reviewer workspace must:

- Display pending requests with their IDs, titles, descriptions, and submission dates.
- Provide Approve and Reject actions.
- Display loading, empty, success, and error states.
- Prevent accidental duplicate submissions while a decision is processing.
- Refresh the pending list after a successful decision.
- Display clear messages for missing requests, invalid states, or permission errors.

The UI must not be treated as the security boundary. All authorization and workflow rules must also be enforced by the backend.

## 6. API specification

All protected operations use the existing HTTP-only authentication cookie.

### GET /api/requests/pending

Access: REVIEWER only; return only assigned, non-self-owned pending records, ordered by submission time then ID.

Returns pending requests as JSON.

- 200: Pending requests returned, including an empty list when none exist.
- 401: User is not authenticated.
- 403: User does not have the Reviewer role.
- 500: Unexpected server error.

### PATCH /api/requests/:id/decision

Access: REVIEWER only, and only the assigned non-owner of the request.

Example request:

```json
{
  "decision": "APPROVED"
}
```

The decision must be either `APPROVED` or `REJECTED`.

On success, the API updates the request and returns the saved record.

- 200: Decision saved successfully.
- 400: Invalid request ID or decision value.
- 401: User is not authenticated.
- 403: Wrong role, wrong assignment, unassigned record, or self-approval attempt.
- 404: Request does not exist.
- 409: Request has already been decided.
- 500: Unexpected server error.

Both successful endpoints return Request JSON (a list for GET, one object for PATCH): `id`, `title`, `description`, `status`, `requesterId`, nullable `assignedReviewerId`, nullable `reviewerId`, ISO `createdAt`, and nullable ISO `decidedAt`. No User password/hash/session fields are included. Errors use `{ "error": "user-safe message" }`. IDs must be canonical positive decimal PostgreSQL integers (1 through 2147483647). Reject missing, null, incorrectly typed, or unsupported decisions. Client-supplied Reviewer/owner/assignment values cannot override server identities. Unexpected failures return a generic error without internal details.

## 7. Data specification

The Prisma Request model, including the additive assignment change, includes:

- `id`
- `title`
- `description`
- `status`
- `requesterId`
- `assignedReviewerId` (new nullable foreign key; separate from decision identity)
- `reviewerId`
- `createdAt`
- `decidedAt`

Valid statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`

A successful decision must update `status`, `reviewerId`, and `decidedAt` consistently.

The backend must derive the Reviewer ID from the authenticated session, never from client-supplied data.

A decision must be conditional on the request still being `PENDING`, preventing two concurrent Reviewers from successfully deciding the same request.

Decision reasons and extended history are outside this proposed Sprint 1 contract and require separate team approval if added later.

The migration is `server/prisma/migrations/20261112000000_reviewer_assignment/migration.sql`. The assignment foreign key uses `onDelete: SetNull`; the index is `(assignedReviewerId, status, createdAt, id)`. A null assignment is never reviewable. Existing Requester/deciding-Reviewer relations and enum values are preserved. F-01 authentication schema/middleware requires no change. UI and API layers change for the Reviewer workflow; the original F-02 endpoints remain and expose the new assignment/decision fields as Request JSON.

## 8. Acceptance criteria

- **AC-01 — Pending list:** A signed-in Reviewer can retrieve pending requests.
- **AC-02 — Approval:** A Reviewer can approve a Pending request and save the Reviewer identity and decision time.
- **AC-03 — Rejection:** A Reviewer can reject a Pending request and save the Reviewer identity and decision time.
- **AC-04 — Persistence:** A saved decision remains available after a new database retrieval, including to the owning Requester.
- **AC-05 — Authorization:** Signed-out users and Requesters cannot access Reviewer operations.
- **AC-06 — Pending-only rule:** An approved or rejected request cannot receive another decision.
- **AC-07 — Validation:** Invalid request IDs and decision values are rejected without changing stored data.
- **AC-08 — Concurrent decisions:** Two simultaneous decision attempts cannot both succeed for the same Pending request.
- **AC-09 — UI behavior:** The Reviewer UI displays pending requests, allows decisions, and handles loading, success, empty, and error states.
- **AC-10 — Assignment:** Only the assigned Reviewer can list/decide a request; unassigned and unrelated records remain private and unchanged. New submissions receive server assignment or fail with `503` without saving.
- **AC-11 — Self-approval:** A Reviewer cannot list or decide their own request, including a Requester whose role subsequently changed.

Validation tests will cover missing records (`404`), zero/negative/fractional/out-of-range/nondecimal IDs, invalid decision values, both protected endpoints for signed-out/wrong-role callers, spoofed decision identity, and unchanged data on refusal. Concurrency tests must establish one `200`, one `409`, and one intact persisted decision. UI tests must cover both actions, retry/error recovery, duplicate suppression, and a successful save followed by a failed refresh without falsely reporting a failed save.

## 9. Software Test Specification

The original planned TEST-F03-01 through TEST-F03-09 IDs are preserved below. Actual tests combine or expand some planned cases; their concrete names/files are identified rather than claiming a one-to-one naming match. The API/database fixtures use a fresh migrated PostgreSQL cluster, synthetic seeded users, and separate session agents. No persistence or authorization is mocked except the explicitly identified error-injection case. All expected refusals must preserve the stored Request.

| Planned ID / linked AC | Level and actual test target | Preconditions / input / action | Expected result |
|---|---|---|---|
| TEST-F03-01 / AC-01 | API/database: `server/test/reviewer.test.ts`, `TEST-F03-01: lists only assigned non-self-owned Pending records`; `TEST-F03-EMPTY` | Seed own assignment, another assignment, unassigned, self-owned, and completed requests. GET as Reviewer. Also GET as a Reviewer with no eligible work. | `200`; only eligible records; `[]` when none; no User secrets. |
| TEST-F03-02 / AC-02 | API/database: `TEST-F03-02/03/04: persists APPROVED with session identity and owner retrieval` | Assigned pending request; PATCH `APPROVED` with spoofed owner/Reviewer/time fields. | `200`; saved status, authenticated Reviewer identity, server time; spoofed identities ignored; absent from pending list. |
| TEST-F03-03 / AC-03 | API/database: same combined test name with `REJECTED` | Separate assigned pending request; PATCH `REJECTED`. | Same guarantees for rejection. |
| TEST-F03-04 / AC-04 | API/database: combined approval/rejection cases; UI `TEST-F03-UI-OWNER` in `client/src/RequesterEvidence.test.tsx`; `server/scripts/smoke.mjs` | After decision, independently read through Prisma and owner's `/mine`. Restart the built application, then retrieve again. | Status, deciding Reviewer ID, and identical ISO decision timestamp persist; owner UI displays metadata. |
| TEST-F03-05 / AC-05 | API/database: `TEST-F03-05`; `TEST-F03-SESSION` | GET/PATCH without a session, as Requester, and with invalid/expired/unknown-user session tokens. | `401`/`403` as appropriate; no private data or mutation. |
| TEST-F03-06 / AC-06 | API/database: two `TEST-F03-06: refuses to replace an existing APPROVED/REJECTED decision` cases | Save a decision, snapshot the row, attempt the opposite decision. | `409`; original status, identity, and timestamp unchanged. |
| TEST-F03-07 / AC-07 | API/database: seven `TEST-F03-07-ID`, seven `TEST-F03-07-VALUE`, `TEST-F03-07-MISSING`, `TEST-F03-JSON`; unit `TEST-F03-UNIT-02/03` in `server/test/reviewer-rules.test.ts` | Zero, negative, fractional, scientific, leading-zero, nonnumeric, overflow IDs; null/object/array/nonterminal decisions; missing decision/record; malformed JSON. | Invalid input `400`; absent valid ID `404`; safe JSON; no mutation. Unit boundary checks accept IDs 1/2147483647 and refuse unsupported forms/decisions. |
| TEST-F03-08 / AC-08 | API/database: `TEST-F03-08: concurrent decisions have exactly one winner and preserve its metadata` | An independent connection holds a row lock on the Pending request. Start opposite PATCH requests and use another connection to observe two distinct active UPDATE sessions blocked directly/indirectly behind that lock. Release only after observing both; always release/drain/close in cleanup. | Confirm actual database overlap before asserting one `200`, one `409`; database matches the winner's status, identity, and time. |
| TEST-F03-09 / AC-09 | UI with mocked API: `client/src/ReviewerWorkspace.test.tsx`, `TEST-F03-UI-01` through `TEST-F03-UI-09`, plus `TEST-F03-UI-STRICT-01/02/03` | Restore Reviewer session; render details; approve/reject; deferred loading/save; empty result; network failure/retry; `403/404/409/500`; double click; failed refresh after successful save; logout. In StrictMode, resolve older GETs after approval/rejection, resolve an obsolete error, and finish an old GET while a newer refresh is loading. | Correct states and credentials/body; one PATCH on double click; saved success retained if refresh fails. Obsolete loads cannot restore decided rows, add old errors, or clear newer loading state. |
| TEST-F03-10 / AC-10 | API/database: `TEST-F03-10`, `TEST-F03-10-SUBMIT`, `TEST-F03-10-UNAVAILABLE`, `TEST-F03-10-WRONG-ROLE`; unit `TEST-F03-UNIT-01` | Wrong/unassigned Reviewer; forged assignment on creation; missing or non-Reviewer designated account. | Wrong assignment excluded from list; PATCH `403`; new request assigned by server; unavailable assignment `503` and no new row. |
| TEST-F03-11 / AC-11 | API/database: `TEST-F03-11: self-approval is refused even after a role change`; unit `TEST-F03-UNIT-01` | Reviewer-owned request, assigned to that same identity, representing a Requester whose role changed. | Excluded from list; PATCH `403`; unchanged row. |
| Shared ownership / BR-02, NFR-02 | API/database: `TEST-F02-OWNERSHIP` | A distinct Requester retrieves their own list after another owner's decision. | Other owner's record/history absent. |
| Safe failure / NFR-03 | API/database with explicit failure injection: `TEST-F03-ERROR` | Inject failures in pending-list query and transaction entry, then independently retrieve the row. | Generic `500` responses; no exception details; unchanged request. This is error behavior evidence, not a substitute for the real persistence/concurrency tests. |

**Execution status:** After the final review corrections on 12 November 2026, backend **55/55** and frontend **19/19** passed, with zero failed/skipped, plus both TypeScript checks, both production builds, and the built HTTP/restart smoke checks. Backend totals: six unchanged regressions, 36 Reviewer/ownership/validation cases including the observed-overlap concurrency test, three rule unit tests, and ten owned-cluster cleanup safety tests. Frontend totals: original Requester journey, 12 existing Reviewer cases, four StrictMode regressions, and two Requester evidence cases. The StrictMode cases first failed against the old implementation (four failures, 12 existing cases passing). A real zero-second pg_ctl startup-wait exercise returned the expected failure and then stopped only its owned cluster. See the report for current and historical evidence; no teammate acceptance is implied.

## 10. Definition of Done

F-03 is complete when:

- All acceptance criteria are satisfied.
- Reviewer backend routes and UI are implemented.
- Authorization is enforced on the server.
- Decisions are persisted correctly.
- Automated tests pass and actual results are recorded.
- The feature contract matches the implemented behavior.
- The teammate reviews and approves the changes.
- The feature is integrated through the agreed team workflow.
- The shared [Product DoD](product-dod.md) is satisfied, including current setup/documents, disclosed incomplete work, and recorded test/version evidence. Local verification alone does not satisfy pending review/integration gates.

## 11. History

| Revision | Actual sequence and evidence |
|---|---|
| User's initial local draft | Present as an untracked file before this implementation. AC-01-AC-09 and TEST-F03-01-TEST-F03-09 originated there and are retained. No invented prior commit or approval. |
| 12 November 2026, design resolution | Rechecked teacher Theme 5/Part E; user explicitly selected one designated seeded Reviewer assigned by the server. Assignment, self-approval, atomic decision, and minimum history design were recorded in this file before implementation. |
| 12 November 2026, red checks | Actual backend red run: 27 failed, six existing regressions passed; missing Reviewer routes returned `404`, creation did not assign, and missing designated Reviewer still allowed saving. Actual Reviewer UI red run: 12 failed because the placeholder lacked the required behavior. Logs retained locally and indexed in verification report. |
| 12 November 2026, implementation and green checks | Added assignment migration, conditional transactional decision routes, independent authorization/rule checks, Reviewer UI, metadata display, detailed STS, and real isolated database tests. Final 45 backend/15 frontend tests, builds, and restart smoke checks passed on Node 24.15. |
| 12 November 2026, final review corrections | Added load generations to ignore obsolete success/error/loading callbacks across StrictMode and decisions; four failing UI regressions became passing. Added owned-directory/marker/PID/port cleanup checks for attempted startup, including a real startup-timeout exercise and ten unit cases. Strengthened the concurrency test with an observed two-session row-lock barrier. Current complete suites: 55 backend and 19 frontend passing; builds/typechecks/smoke re-executed successfully. No domain rules, endpoint contracts, or feature IDs changed. |
| Versioned review/release | Pending user's Git approval and teammate review/integration. Local files/logs establish the observed working sequence but do not substitute for immutable reviewed contract/code history. |
