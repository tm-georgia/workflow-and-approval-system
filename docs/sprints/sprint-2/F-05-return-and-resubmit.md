# Deliverable 2 Part B — F-05 Return for changes and owner resubmission

**Approval, 28 November 2026.** The requester approved this contract for local implementation in the F-04 worktree. Teammate review and the decision on assigned Reviewer history access remain pending integration. History reads in this implementation are owner-only.

## Requirements and scope

An assigned Reviewer returns a pending purchase request for correction. Its owner revises the title and description and resubmits the same request to the same queue. FR-08 requires both transitions and preservation of earlier events. BR-07 requires a saved return reason. BR-08 restricts returning to an authorized Reviewer and revision to the owner of a returned request. NFR-01 requires HTTP 401 for unauthenticated access, NFR-02 requires enforceable role and ownership checks, and NFR-03 requires persisted data to survive an application restart. F-05 depends on F-01 authentication, F-02 owner retrieval, F-03 assignment and the F-04 event model. [SRS](../../srs.md) · [Feature inventory](../../features.md) · [Sprint plan](../plan.md) · [F-04 contract](F-04-rejection-reason.md)

## Interface, authorization and data

- **Return for changes.** An assigned, non-owner Reviewer sends `PATCH /api/requests/:id/decision` with `{"decision":"RETURNED","reason":"Please include an itemized cost breakdown in the description"}`. From PENDING, return HTTP 200, set RETURNED, remove the request from the pending queue and append a RETURNED event. The UI provides a labeled reason field, validates blank input and retains the draft after failure.
- **Edit and resubmit.** Only the authenticated owning Requester may send `PATCH /api/requests/:id/resubmit` with revised title and description. Require two nonblank strings and trim both. On HTTP 200 show PENDING, the corrected fields and retained history. Prefill the owner form on returned requests and keep edits on failure. The assigned Reviewer sees the corrected request in the pending queue.
- **Reads and errors.** Use the owner-scoped `GET /api/requests/mine` and existing assigned pending queue. Derive identities and assignment on the server. For known requests, check access before state or content validation. Return JSON errors with HTTP 401 for missing/invalid session, 403 for forbidden access, 409 for an invalid transition and 400 for invalid input on an eligible record.
- **Storage.** Extend RequestStatus with RETURNED and ReviewAction with RETURNED and RESUBMITTED. A return event retains the trimmed reason, actor and same server timestamp as the current decision. A resubmission event identifies the owner, has a server timestamp and a null reason. Require nonblank reasons for REJECTED and RETURNED. On resubmission clear current reviewerId and decidedAt, retain id, requesterId, assignedReviewerId and createdAt, and append history. Order by occurredAt and then event id, ascending.
- Use conditional writes with ownership/assignment and expected status in one transaction with the event insert. Preserve Sprint 1 metadata and existing F-04 rows. The restricted runtime role needs additional UPDATE privileges only on Request.title and Request.description.

## Acceptance criteria

1. **F05-AC01.** An assigned Reviewer returns an eligible request and the owner can read the reason, actor and timestamp.
2. **F05-AC02.** The owner corrects and resubmits the original request. Its identity and assignment persist and the assigned queue displays the revised details.
3. **F05-AC03.** Earlier events survive a second return and an application restart, in their original order.
4. **F05-AC04.** Invalid reasons or editable fields produce HTTP 400 and preserve the request and event list.
5. **F05-AC05.** Unauthenticated, wrong-role, unassigned, self-review and non-owner operations fail without mutation or disclosure.
6. **F05-AC06.** Invalid states and repeated transitions produce HTTP 409. Competing writes from one state have one winner. A failed event insert rolls back all request edits.
7. **F05-AC07.** The workspaces display role-appropriate controls and validation, preserve failed drafts and reflect successful transitions.

## Software test specification

| ID | Level and AC | Procedure and expected evidence |
|---|---|---|
| F05-T01 | API/database, AC01 | Return a pending fixture with a space-padded reason. Assert 200, RETURNED, queue removal and an owner read containing exactly one event with trimmed reason, actor and timestamp. |
| F05-T02 | API/database, AC02 | Correct a returned fixture. Assert 200, same identity, trimmed fields, PENDING, cleared decision metadata, intact prior event, one owner-authored RESUBMITTED event and revised assigned queue entry. |
| F05-T03 | Restart smoke, AC03 | Return, resubmit and return with a distinct second reason. Restart the application against the same local PostgreSQL database. Sign in again and compare the owner’s status, details and all three ordered events. |
| F05-T04 | API/database, AC04 | Omit the reason or send empty, whitespace-only and non-string values. Repeat for each editable field. Expect 400 and compare the whole row and history before and after. |
| F05-T05 | API/database, AC05 | Attempt both writes signed out and with wrong roles, unassigned and self-reviewing Reviewers, and another Requester. Assert 401/403, unchanged data and absence of the owner’s record/reason from another Requester's list. |
| F05-T06 | API/database, AC06 | Return from RETURNED/APPROVED/REJECTED and resubmit from PENDING/APPROVED/REJECTED. Race two valid calls for each transition. Check 409 on conflicts and exactly one new event per winning transition. |
| F05-T07 | Transaction integration, AC06 | Force the event insert to fail separately on return and resubmission. Verify the complete prior record and history survive. |
| F05-T08 | UI, AC07 | Exercise blank reason feedback, owner prefill, failed draft retention, successful retry, retained history and revised queue content. |

## Definition of Done

Record genuine pre-implementation results and final evidence. Demonstrate the cycle with the restricted local database role, an application restart, all eight tests, passing F-01 through F-04 regressions, server typecheck and client build. Team integration requires teammate review of the tested version and resolution of Reviewer history visibility.
