# Part A — Software Requirements Specification

## 1. Stakeholder problem and context

A department needs controlled approval of internal purchase requests. Requesters submit a request describing the purchase and check its status. An authorized Reviewer reviews requests and records the outcome. The application replaces informal approval messages with an authenticated, persistent workflow.

**Context decision used in this draft:** internal departmental purchase requests. The Sprint 1 form uses a title and description; the title identifies the purchase and the description contains its details and justification. If the team has selected a different Theme 5 context—funding, travel, reimbursement, or another similar request—replace this context consistently before submission.

## 2. Actors and responsibilities

- **Requester:** Signs in, submits requests, and views only their own requests and statuses. In Sprint 2, a Requester may revise and resubmit a request returned for changes.
- **Reviewer:** Signs in, views requests they are authorized to review, and records review outcomes.
- **Application operator:** Runs and configures the application and database. Advanced in-app account administration is outside this deliverable.

## 3. Product scope

The whole product provides authentication, request submission, authorized review, decision/state history, return/resubmission, additional approval stages, filtering, and decision summaries/reporting.

- **Sprint 1:** Sign-in/out and current-user identity; Requester submission and retrieval; Reviewer review and approve/reject; saved review outcome; server-side access checks; prevention of self-approval and invalid transitions.
- **Sprint 2:** Return for changes and resubmission; additional approval stages.
- **Sprint 3:** Filtering and decision summaries/reporting, integration, and product hardening.

## 4. Exclusions

- Self-registration, password recovery, email verification, and advanced account administration.
- Real payment processing, external messaging, and external APIs.
- Docker, completed CI/CD, and GCP deployment for Deliverable 1; those are assessed in Lab 5.
- A separate cloud staging environment.

## 5. Functional requirements

### Sprint 1

- **FR-01 — Authentication and identity:** A user can sign in with valid credentials, sign out, and retrieve the identity and role of the signed-in account.
- **FR-02 — Submit request:** An authenticated Requester can submit a request with a non-empty title and description. The system obtains the Requester identity from the session and saves the request in `PENDING` status.
- **FR-03 — View own requests:** An authenticated Requester can retrieve their own requests and statuses; another Requester's private requests are not returned.
- **FR-04 — View authorized review queue:** An authenticated, designated Reviewer can retrieve pending requests in the department's review scope. Sprint 1 uses one designated seeded Reviewer authorized for all requests in that scope; there is no user-selectable assignment screen.
- **FR-05 — Approve or reject:** The designated Reviewer can approve or reject a request that is awaiting review. The API records the outcome, acting Reviewer, decision time, and reason.
- **FR-06 — Retrieve review outcome:** The saved outcome remains available when the request is retrieved again. In Sprint 1 the request record stores its one final decision, including status, Reviewer, decision time, and reason. Sprint 2 adds multi-event history for returns/resubmissions and additional stages.

### Sprint 2

- **FR-07 — Return for changes:** An authorized Reviewer can return a request to its Requester with a reason; the reason and state are visible to the Requester.
- **FR-08 — Revise and resubmit:** The Requester can revise and resubmit their own returned request. Earlier return and resubmission events remain in history.
- **FR-09 — Additional approval stages:** A request can pass through the agreed ordered approval stages. The system records each stage's outcome and identifies the final outcome.

### Sprint 3

- **FR-10 — Filter requests:** Users can filter only the requests they are authorized to see, using agreed status and workflow fields.
- **FR-11 — Decision summaries and reporting:** Authorized users can view decision summaries for records within their permitted scope.

## 6. Business rules

- **BR-01 — Initial state:** A newly submitted request starts in `PENDING`.
- **BR-02 — Requester ownership:** A Requester can retrieve only their own requests. The API derives ownership from the authenticated session, not a client-supplied ID.
- **BR-03 — Reviewer authorization:** In Sprint 1, only the designated Reviewer account may access the department's review queue or decide its requests. Other Reviewer accounts are forbidden unless explicitly authorized.
- **BR-04 — No self-approval:** A request's Requester cannot approve or reject that same request, even if it is incorrectly associated with the designated Reviewer.
- **BR-05 — Pending-only decision:** Approve/reject is allowed only while the request is `PENDING`. A second decision attempt is rejected and cannot overwrite the first outcome.
- **BR-06 — Recorded decision:** A successful decision stores the final status, the Reviewer who acted, decision time, and reason on the request. A rejected transition makes no database change.
- **BR-07 — Return reason and ownership (Sprint 2):** A return includes a reason; only the request owner may revise/resubmit a request in the returned state.
- **BR-08 — Ordered approvals (Sprint 2):** A later stage cannot decide before required earlier stages are complete. The exact stage sequence must be agreed before implementation.
- **BR-09 — Report authorization (Sprint 3):** A summary includes only records the requesting user is allowed to access.

## 7. Non-functional requirements

- **NFR-01 — Unauthenticated access:** A protected API request without a valid session returns HTTP `401` and no protected record data. Verify with API tests.
- **NFR-02 — Role, ownership, assignment, and self-approval:** An unauthorized attempt returns HTTP `403` and does not change request state. Verify with tests for another Requester's record, an unrelated Reviewer, a Requester invoking review operations, and self-approval.
- **NFR-03 — Persistence:** After a request is submitted or decided, the saved result can be read back from PostgreSQL. Verify by writing and retrieving through API/database integration tests.
- **NFR-04 — Credential and secret protection:** Passwords are stored as hashes; real credentials and secrets are absent from Git, client code, and API responses. Verify through tests and configuration/repository inspection.

## 8. Assumptions and decisions

| ID | Decision / assumption | Resolution |
|---|---|---|
| AD-01 | Theme context | This draft uses internal purchase approval. Change only if the team selected a different context. |
| AD-02 | Sprint 1 request fields | Keep the implemented title and description fields; use them for purchase name/details and justification. No structured amount field is required by this draft. |
| AD-03 | Reviewer assignment | One designated seeded Reviewer is authorized for all requests in the department's Sprint 1 scope. Assignment is by scope/policy; there is no per-request selection UI. F-03 must enforce this Reviewer identity server-side. |
| AD-04 | Self-approval | Always prohibited; compare the Requester identity with the acting Reviewer identity in the backend. |
| AD-05 | Sprint 1 decision | One final approve/reject decision. Persist status, Reviewer ID, decision time, and reason. F-03 may add the reason field through a migration; keep F-01/F-02 behavior unchanged. |
| AD-06 | Editing and return | No editing of a pending request in Sprint 1. Sprint 2 return-for-changes enables the owner to revise/resubmit while preserving events. |
| AD-07 | Multi-stage workflow | Deferred to Sprint 2; exact ordered stages are specified before that feature is implemented. |
| AD-08 | Authentication | Current implementation uses bcrypt password hashes and an HTTP-only JWT cookie with one-hour expiry; see `docs/system-sds.md`. |

## 9. Verification allocation

Sprint 1 verification is listed in `docs/traceability.md` and detailed in the F-01, F-02, and F-03 contracts. Sprint 2 and Sprint 3 features are allocated in the baseline now; their detailed acceptance criteria and executable tests are written before implementation in those sprints.

## 10. Known implementation gaps

F-01 and F-02 are implemented. F-03 still needs the Reviewer queue/decision endpoints and tests for the designated Reviewer, self-approval, Requester review attempts, unrelated Reviewer access, and repeated decisions. The current Request schema has no decision-reason field; add it in the F-03 migration and update the data-model section of the System-Level SDS. The existing request row can record one final decision; multi-event history is planned for Sprint 2. Do not describe incomplete F-03 or later-sprint behavior as implemented.