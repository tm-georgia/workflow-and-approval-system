# Part A — Software Requirements Specification

## 1. Stakeholder problem and context

A department needs a reliable way to approve internal purchase requests. Requesters submit purchase details and check the result. An authorized Reviewer examines assigned requests and records a decision. The system replaces approval decisions scattered across messages with a controlled, persistent workflow.

The selected context is **departmental purchase requests**. A request has a title for the purchase and a description for its purpose and details. This is one bounded example of the funding, purchase, travel, reimbursement, or similar workflow in Theme 5.

## 2. Actors

- **Requester:** signs in, submits a request, and views only their own requests and statuses.
- **Reviewer:** signs in and reviews only requests assigned or authorized to them.
- **Application operator:** configures and runs the application and database. In-app account administration is excluded from this checkpoint.

## 3. Scope and workflow decisions

The three-sprint product baseline covers authentication, submission, review, recorded decisions, reasons and history, return/resubmission, filtering, and decision summaries.

- **Sprint 1:** login/logout/current identity; Requester submission and retrieval; assigned Reviewer queue; approve/reject; persist status, deciding Reviewer, and decision time; enforce access, ownership, pending-only, and no-self-approval rules.
- **Sprint 2:** record decision reasons and an ordered decision history; return a request for changes; let its owner revise and resubmit it while retaining prior events.
- **Sprint 3:** filter authorized requests and provide decision summaries/reporting; integrate and harden the complete product.

The selected workflow has **one approval stage and one designated seeded Reviewer for the department’s request scope**. There is no multi-stage approval or per-request assignment screen in this baseline. A new request stores its assigned Reviewer ID. A Requester cannot edit a pending request; the planned Sprint 2 return/resubmission flow is the route for corrections. Reasons are part of the product baseline, but the team's plan places their capture and extended event history in Sprint 2. Sprint 1 still records the decision outcome, Reviewer, and time as required by its example.

## 4. Exclusions

- Self-registration, password recovery, email verification, and advanced in-app account administration.
- Real payment processing, external messaging, and external APIs.
- Docker, CI/CD, and GCP deployment for Deliverable 1; these are Lab 5 work.
- A separate cloud staging environment.

## 5. Functional requirements

### Sprint 1

- **FR-01 — Authentication and identity:** A user can sign in with valid credentials, sign out, and retrieve the identity and role of the signed-in account.
- **FR-02 — Submit request:** An authenticated Requester can submit a request with a non-empty title and description. The server derives the Requester identity and saves the request as PENDING.
- **FR-03 — View own requests:** An authenticated Requester can retrieve their own requests and statuses. Another Requester's records are not returned.
- **FR-04 — View review queue:** An authenticated assigned Reviewer can retrieve eligible pending requests in the department scope.
- **FR-05 — Approve or reject:** An assigned Reviewer can approve or reject an eligible PENDING request.
- **FR-06 — Retrieve recorded decision:** A saved decision remains available on later retrieval and records its status, deciding Reviewer, and decision time.

### Sprint 2

- **FR-07 — Decision reasons and history:** The system records the reason for each review decision and provides an ordered history of review actions to authorized users.
- **FR-08 — Return and resubmit:** A Reviewer can return a request with a reason; its owner can revise and resubmit it. Earlier review events remain available.

### Sprint 3

- **FR-09 — Filter requests:** A user can filter only the requests they are authorized to view using agreed status/workflow fields.
- **FR-10 — Decision summaries:** Authorized users can view summaries calculated from persisted decisions within their permitted scope.

## 6. Business rules

- **BR-01 — Initial state:** A newly submitted request starts in PENDING.
- **BR-02 — Requester ownership:** A Requester can retrieve only their own requests. Ownership is derived from the authenticated session.
- **BR-03 — Reviewer permission:** Only an authenticated Reviewer may use review operations; the Reviewer must also be assigned or authorized for the request.
- **BR-04 — Pending-only decision:** Approve/reject is allowed only while a request is PENDING. Repeated or competing decisions cannot overwrite the first result.
- **BR-05 — Assigned Reviewer:** The server assigns each new request to the designated seeded Reviewer. The client cannot choose or change the assignment. Unassigned requests are not reviewable.
- **BR-06 — No self-approval:** A request's owner cannot approve or reject that request, even if the owner is later given a Reviewer role.
- **BR-07 — Decision reason:** In Sprint 2, each approve, reject, or return action must include a non-empty reason that is saved with its history event.
- **BR-08 — Return/resubmission ownership:** Only the request owner may revise and resubmit a request in the returned state; only an authorized Reviewer may return it.
- **BR-09 — Report authorization:** A decision summary includes only records the requesting user is authorized to see.

## 7. Non-functional requirements

- **NFR-01 — Reject unauthenticated access:** A protected API request without a valid session returns HTTP 401 and no protected request data. Verify with API tests.
- **NFR-02 — Enforce role and ownership:** Forbidden role, assignment, ownership, and self-approval operations return HTTP 403 and do not mutate data. Verify with API/database tests.
- **NFR-03 — Persist workflow data:** After submission or decision, the saved result can be read back from PostgreSQL after a new request and application restart. Verify with integration/smoke tests.
- **NFR-04 — Protect credentials and secrets:** Passwords are stored as hashes; real secrets are absent from Git, client bundles, and API responses. Verify with tests and repository/configuration inspection.

## 8. Assumptions and decisions

| ID | Decision | Resolution |
|---|---|---|
| AD-01 | Theme context | Departmental purchase requests, using the existing title and description fields. |
| AD-02 | Reviewer assignment | One designated seeded Reviewer is authorized for the department scope; the server stores the assignment. |
| AD-03 | Approval stages | One Reviewer decision is the complete approval chain for this bounded context; multi-stage approval is excluded from this baseline. |
| AD-04 | Pending edits | A Requester cannot edit a pending request. Sprint 2 return/resubmission permits owner corrections. |
| AD-05 | Decision reasons/history | The overall product records reasons and ordered history in Sprint 2. Sprint 1 stores outcome, Reviewer identity, and timestamp. |
| AD-06 | Authentication | Password hashes and an HTTP-only JWT cookie are used; see the System-Level SDS. |
| AD-07 | Demo data | Seeded Requester and Reviewer accounts use synthetic local-only credentials. |

## 9. Implementation status

F-01, F-02, and F-03 are implemented in the current sprint-staging history. Their local verification is recorded in the Sprint 1 verification documents. Sprint 2 and Sprint 3 behavior above is planned, not claimed as implemented. The F-01 and F-02 contracts disclose that they were documented retrospectively after their implementation.
