# Part C — System-Level Software Design Specification

## 1. Purpose and scope

The Workflow and Approval System supports departmental purchase requests. A Requester submits a purchase request, an assigned Reviewer approves or rejects it, and the Requester can retrieve the saved status. The current Sprint 1 implementation uses one approval stage. Reasons and extended event history, return/resubmission, filtering, and reports are planned in later sprints as described in the SRS and sprint plan.

## 2. Architecture and responsibilities

| Layer | Technology | Responsibility |
|---|---|---|
| Web client | React, TypeScript, Vite | Login; Requester submission/history; Reviewer queue and decision actions; form validation and loading/empty/success/error states. |
| API/application | Node.js, Express, TypeScript | Session identity, role/ownership/assignment checks, input validation, workflow rules, safe JSON responses. |
| Persistence | PostgreSQL with Prisma ORM | Users, password hashes, requests, ownership, Reviewer assignment, status, decision identity/time; migrations and seed data. |

The browser sends JSON requests to Express through same-origin `/api` routes. During local development Vite proxies `/api` to the backend. Express applies business rules and uses Prisma to access PostgreSQL. Client controls improve usability but are not authorization controls.

## 3. Current and planned data design

### Persistent entities

| Entity | Important fields | Relationships and constraints |
|---|---|---|
| User | id, email, passwordHash, role, createdAt | Unique email; role is REQUESTER or REVIEWER; password is a bcrypt hash. |
| Request | id, title, description, status, requesterId, assignedReviewerId, reviewerId, createdAt, decidedAt | Required Requester owner; optional assigned Reviewer and deciding Reviewer; initial status PENDING; assignment is server controlled. |
| ReviewEvent | id, requestId, actorId, action, occurredAt, reason | Retains ordered approval, rejection, return, and resubmission events; decision reasons are nonblank, while owner resubmission events have no reason. |

A Requester's owner relationship is separate from the assigned Reviewer and the Reviewer who decides. Existing request records are not automatically assigned by the F-03 migration. Final decision status, deciding Reviewer, and time remain on the request; F-04/F-05 events retain the reasoned decision history. A request can move from PENDING to APPROVED, REJECTED, or RETURNED; its owner can resubmit a RETURNED request to PENDING.

### Sprint 2 decision history

F-04 requires a trimmed, nonblank reason for approval and rejection and saves each decision with its ordered ReviewEvent in the same transaction. F-05 uses retained events for return/resubmission. The owner's `GET /api/requests/mine` response includes events ordered by occurrence time and event ID. Reviewer queue and decision responses do not include history; a separate Reviewer history-read permission remains undecided. Older Sprint 1 decisions remain readable without synthesized events.

## 4. UI and navigation

| Screen/state | Behavior |
|---|---|
| Sign-in | Email/password form; show/hide password; safe invalid-login message. |
| Requester workspace | Submit title/description and view only the signed-in Requester's requests and statuses. Show loading, empty, submission-success, and safe error states. A successful submission remains successful if the subsequent history refresh fails. Display a separate history-refresh warning and provide a manual retry action with loading feedback. A successful retry updates the displayed history and clears the warning; a failed retry preserves previously displayed history and keeps the warning visible. Retrying history must not submit another request. |
| Reviewer workspace | Show only assigned, non-self-owned pending requests; require a reason for approve/reject/return; show loading, empty, success, error, and retry states; suppress duplicate submissions. |
| Current-user loading | Client obtains identity from `GET /api/auth/me`; it never chooses a role or owner ID. |

## 5. API conventions

The API uses JSON and safe error objects such as `{ "error": "user-safe message" }`. Password hashes, tokens, SQL, stack traces, and secrets are not returned.

| Method/path | Access | Purpose |
|---|---|---|
| POST /api/auth/login | Public | Verify credentials; return id/email/role and set an HTTP-only cookie. |
| POST /api/auth/logout | Public | Clear the cookie; return 204. |
| GET /api/auth/me | Signed in | Return identity from the verified session; otherwise 401. |
| POST /api/requests | Requester | Create a PENDING request using the session owner and server-designated Reviewer. |
| GET /api/requests/mine | Requester | Return only the current Requester's requests with oldest-first history. |
| GET /api/requests/pending | Assigned Reviewer | Return only assigned, non-self-owned pending requests. |
| PATCH /api/requests/:id/decision | Assigned Reviewer | Approve/reject/return a pending request with a nonblank reason; persist status and event atomically. |

Use 401 for missing/invalid sessions, 403 for forbidden role/ownership/assignment, 400 for invalid input, 404 for missing records, 409 for a request already decided, and a generic 500 for unexpected failures. The F-01/F-02/F-03 contracts define endpoint-specific shapes and boundary behavior.

## 6. Role and permission matrix

| Operation | Signed out | Requester | Designated Reviewer |
|---|---|---|---|
| Sign in | Allowed | Allowed | Allowed |
| Retrieve current identity / sign out | No private identity | Own session | Own session |
| Submit a request | Denied | Allowed; owner comes from session | Denied |
| List own requests | Denied | Own records only | Denied |
| View pending review queue | Denied | Denied | Assigned, non-self-owned records only |
| Approve/reject/return | Denied | Denied | Assigned non-owner; pending-only; requires a reason |
| Read request history | Denied | Own requests only | Not currently exposed |

All authorization is enforced by the API and database predicates, not merely by hidden buttons.

## 7. Authentication and secrets

Passwords are checked using bcryptjs; only hashes are stored. Successful login issues a JWT with a one-hour expiry in the HTTP-only `accessToken` cookie. SameSite is Lax and Secure is enabled in production. `GET /api/auth/me` returns the verified account identity. Logout clears the browser cookie; copied tokens remain valid until expiry, a documented limitation of this design.

`DATABASE_URL` and `JWT_SECRET` are supplied through environment variables. Keep local values in the ignored `server/.env` and deployment values in a secret manager. Never commit secrets or include them in client code or submitted evidence.

## 8. Reproducibility and planned GCP design

The README documents dependency installation, local environment configuration, PostgreSQL setup, Prisma migration/seed, development run, production build, and test commands. Synthetic seeded accounts are used.

For Lab 5, the intended design is:
- Cloud Run for the containerized web/API service, serving the client and API on one origin.
- Cloud SQL for PostgreSQL with persistent managed storage.
- Secret Manager for `DATABASE_URL` and `JWT_SECRET`.
- Artifact Registry for built container images.
- Cloud Build for build/test and repeatable deployment steps.

The app reads configuration from its environment and stores durable data in PostgreSQL rather than the disposable container filesystem. Actual Docker, CI/CD, and GCP resources are Lab 5 work.

## 9. Current implementation status

F-01, F-02, and F-03 are implemented and integrated into the Sprint 1 workflow.

The earlier Sprint 1 verification report records 55 backend and 19 frontend tests passing, along with builds/typechecks and database-backed restart smoke checks. These results represent the earlier Sprint 1 verification baseline.

### CHG-001 — Requester history recovery

CHG-001 extends F-02 so that a successful request submission remains acknowledged even if the subsequent history retrieval fails. The Requester receives a separate history-refresh warning and can retry retrieving history without submitting the request again.

The implemented behavior includes:
- Successful submission feedback is preserved when the history GET request fails.
- A separate warning informs the Requester that history could not be refreshed.
- A manual retry action retrieves history without creating another request.
- Loading feedback is displayed while the retry is in progress, and duplicate retry actions are prevented.
- A successful retry updates the displayed history and clears the warning.
- A failed retry preserves the previously displayed history and keeps the warning visible.
- Existing submission validation and POST-failure behavior remain unchanged.

CHG-001 verification results:
- All 27 client tests passed across 4 test files.
- The production client build completed successfully.
- Browser verification confirmed that a successful submission remains acknowledged after history retrieval fails.
- A subsequent successful retry updated the request history and cleared the warning without sending a second POST request.
- The implementation was approved and merged into `sprint-staging` through PR #52 on 28 November 2026 (merge commit `5328f22`).

These CHG-001 client test results are separate from the earlier Sprint 1 baseline counts above. They should not be added together as though they were one test run.

F-04–F-07 are planned future work; their full acceptance criteria and executable tests are created before implementation in their respective sprints.
