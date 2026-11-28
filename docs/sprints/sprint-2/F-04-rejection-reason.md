# F-04 — Rejection Reason

## Scope and requirements

This Sprint 2 work covers the rejection action under FR-07 and BR-07.
Apply the existing reviewer permissions and Pending-only rules from
BR-03 through BR-06. Verify access and persistence under NFR-01 through NFR-03.

## UI and API

The Reviewer workspace provides a reason field for rejection and displays
validation feedback while keeping the entered text available for correction.

PATCH /api/requests/:id/decision accepts a rejection with
`{"decision":"REJECTED","reason":"Budget limit exceeded"}`.

The backend requires a string containing non-whitespace text and saves the
trimmed reason. For an authorized Reviewer acting on a Pending request,
an omitted, empty, whitespace-only, or non-string reason returns HTTP 400.
Existing authentication, authorization, and request-state rules apply.

## Data and history

Save the rejection status and its history event in one database transaction.
The event records the request, action, acting Reviewer, time, and reason.
Use the shared F-04/F-05 history design for storage and authorized retrieval.
Existing Sprint 1 decisions remain readable with their recorded metadata.

### Proposed shared event contract

The local branch and fetched `origin/sprint-staging` at `fb48baa` specify
ordered history and leave its schema and read permissions to the feature contracts.

- Append one `ReviewEvent` per successful rejection. Store a generated integer
  `id`, foreign keys `requestId` and `actorId`, an enumerated `action` of
  `REJECTED`, the decision timestamp `occurredAt`, and the trimmed `reason`.
  Use the authenticated actor and the same timestamp as `Request.decidedAt`.
- The owning Requester's existing `GET /api/requests/mine` includes a
  `history` array for each request, oldest first by `occurredAt`, then `id`
  ascending for ties. Other Requesters see only their own requests. Reviewer
  queue and decision responses keep their current fields. The owner can read
  the reason in their request history after refreshing or signing in again.
- Older decisions retain their status, Reviewer and time. Their history array
  is empty until a real event is recorded. The migration creates the event
  table without backfilling reasons.
- Team review with F-05 should confirm the additional action values, the
  reason policy for owner resubmissions, and whether assigned Reviewers need
  a later history read. BR-07 also calls for reasons on approvals and returns.
  This assignment implements the rejection action.
### Runtime grants and local verification

The Lab 5 deployment gave `workflow_runtime` explicit access to the Sprint 1
tables and sequences. After applying the event migration, run the following
from the operations image working directory with the migration owner's
`DATABASE_URL`, before starting the updated application. The SQL file ships
in the operations image and can be applied again safely.

```sh
node node_modules/prisma/build/index.js db execute --config prisma7.config.ts --file prisma/grants/review-event.sql
```

This grants SELECT and INSERT on `public."ReviewEvent"` and USAGE on
`public."ReviewEvent_id_seq"`. PostgreSQL uses this sequence to supply the
integer `id` when the app inserts an event.

Run `npm --prefix server test -- --restricted-review` from the worktree root
to verify on a fresh local cluster. The runner migrates as `workflow_migrator`,
recreates the Sprint 1 grants, and applies the same SQL file. It runs the F-04
rejection and owner-read tests with the application's database connection
logged in as `workflow_runtime`. Its logs record effective privileges before
and after the grant and the resulting event ID.

T01 was first run against the validation-only handler. The PATCH and owner GET
both returned 200. The request was REJECTED and the history assertion received
`undefined` (one failed, 40 filtered skips in the Reviewer test file).

## Acceptance criteria and Software Test Specification

| AC | Test ID and level | Input and expected result |
|---|---|---|
| F04-REJ-AC01 | F04-REJ-T01, API/database integration | The assigned Reviewer rejects a Pending request with a valid reason. The request becomes Rejected and an authorized later read returns the reason with its history event. |
| F04-REJ-AC02 | F04-REJ-T02, API/database integration | The assigned Reviewer submits a rejection with an omitted, empty, whitespace-only, or non-string reason. The API returns 400. The request remains Pending and no event is saved. |
| F04-REJ-AC03 | F04-REJ-T03, API/database integration | An unassigned Reviewer submits a valid rejection. The API returns 403 and the request and history are unchanged. |
| F04-REJ-AC04 | F04-REJ-T04, UI | The Reviewer can enter a reason, see validation feedback, and submit a valid rejection. |

## Definition of Done

The UI and API enforce the contract, the reason can be retrieved from
persisted history, the planned tests and existing decision regression
tests pass, and the teammate-reviewed PR records the tested version.