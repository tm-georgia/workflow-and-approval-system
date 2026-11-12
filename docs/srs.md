# Part A — Software Requirements Specification

## Problem

Requesters need a clear way to submit requests and check what happened to them. Reviewers need a place to view requests and approve or reject them. The system records each request’s status so the result can be checked later.

## Users

- **Requester:** signs in, submits a request, and views their own requests and statuses.
- **Reviewer:** signs in, views requests waiting for review, and approves or rejects them.

## Scope

The planned product supports sign-in, request submission, review decisions, and status tracking. Sprint 1 will deliver a small working version of that workflow using a website, backend, and database.

## Exclusions for the initial version

Self-registration, password recovery, and advanced account administration are not included in this checkpoint. Confirm with the team whether other features are out of scope.

## Functional requirements

- **FR-01 — Sign in and out:** A user can sign in, and the system can identify the signed-in user. The user can sign out.
- **FR-02 — Submit request:** A signed-in Requester can submit a request with the required information.
- **FR-03 — View own requests:** A Requester can view their own submitted requests and their current statuses.
- **FR-04 — View requests for review:** A signed-in Reviewer can view requests waiting for a decision.
- **FR-05 — Decide request:** A Reviewer can approve or reject a request that is waiting for review.
- **FR-06 — Save decision:** The system saves a decision so it remains visible when the request is viewed again.

## Business rules

- **BR-01 — Initial status:** A newly submitted request starts with the status `Pending`.
- **BR-02 — Request ownership:** A Requester may view only their own requests.
- **BR-03 — Reviewer permission:** Only a Reviewer may approve or reject a request.
- **BR-04 — Pending-only decision:** A request may be decided only while its status is `Pending`.
- **BR-05 — Assigned Reviewer:** The server assigns each new request to the designated seeded Reviewer. Only that assigned Reviewer may list or decide it. Unassigned legacy requests are not available for review. Submission fails without saving if the designated account is missing or does not have the Reviewer role.
- **BR-06 — No self-approval:** A Reviewer may not list or decide a request they own, even if their account role changed after submission.

## Non-functional requirements

- **NFR-01 — Protect signed-out users:** A request to a protected feature without signing in is rejected and does not return private request information. Verify with an automated backend test.
- **NFR-02 — Protect role and ownership access:** A user who is not allowed to access or decide a request is refused by the backend. Verify with automated backend tests.
- **NFR-03 — Persist saved requests:** After a successful submission or decision, the saved information remains available when retrieved again from the database. Verify with an integration test.

## Assumptions and decisions to confirm

- The first request form will use a title and description.
- The first workflow has one Reviewer decision: `Approved` or `Rejected`.
- The Requester’s identity comes from the signed-in account, not an ID selected in the website.
- Confirm with the team whether Requesters may edit or cancel a Pending request.
- Confirm with the team whether this simple workflow is the complete product scope or whether more features are planned for later sprints.

## Sprint 1 decisions resolved on 12 November 2026

- The user approved one designated seeded Reviewer for all new requests, assigned by the server. `DESIGNATED_REVIEWER_EMAIL` optionally selects that account; the demo default is `reviewer@example.test`. Assignment is persisted separately from the identity of the Reviewer who eventually decides the request. No existing request is backfilled or reassigned automatically.
- FR-04/FR-05 are constrained by BR-05/BR-06 as well as role permissions. BR-04 is enforced in the database update so concurrent or repeated decisions cannot overwrite the first saved result.
- FR-06's minimum Sprint 1 decision/history record is the final status, Reviewer identity, and decision timestamp on the Request. Save them together and return them on later retrieval by the owning Requester. Sprint 1 allows one terminal decision; it introduces no event log, decision reasons, return, resubmission, or additional stages.
- Extended reasons/history, return/resubmission, filtering, and reporting remain proposed F-04-F-07 in the inventory. This local Sprint 1 clarification does not approve that later scope or resolve its new FR/BR definitions.
- The Requester form's 120-character client title limit is still not an approved server-side product rule; that policy needs teammate agreement. Existing requirement IDs are preserved; BR-05/BR-06 add the approved assignment and teacher-required self-approval rules.
