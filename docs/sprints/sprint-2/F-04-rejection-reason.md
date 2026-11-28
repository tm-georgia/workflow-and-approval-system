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