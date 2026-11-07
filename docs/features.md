# Part B — Feature Inventory

This inventory follows Theme 5. It allocates the full product baseline across three sprints; detailed contracts and executable tests for later-sprint features are due before those features are implemented.

| ID | Feature | Requirements | Sprint | Dependencies |
|---|---|---|---|---|
| F-01 | User signs in/out and retrieves current identity | FR-01, NFR-01, NFR-04 | Sprint 1 | Seeded accounts, database |
| F-02 | Requester submits a request and views only their own status | FR-02, FR-03, BR-01, BR-02, NFR-02, NFR-03 | Sprint 1 | F-01 |
| F-03 | Designated Reviewer views authorized pending requests and approves/rejects with a recorded reason and outcome | FR-04, FR-05, FR-06, BR-03, BR-04, BR-05, BR-06, NFR-02, NFR-03 | Sprint 1 | F-01, F-02; designated-Reviewer policy |
| F-04 | Reviewer returns a request with a reason; Requester revises and resubmits it with events retained | FR-07, FR-08, BR-07, NFR-02, NFR-03 | Sprint 2 | F-02, F-03; multi-event history |
| F-05 | Add ordered approval stages and record each stage's outcome | FR-09, BR-08, NFR-02, NFR-03 | Sprint 2 | F-03, F-04; agreed stage sequence |
| F-06 | Filter authorized requests and produce decision summaries/reports | FR-10, FR-11, BR-09, NFR-02, NFR-03 | Sprint 3 | F-03, F-04, F-05; retained history |

## Cross-cutting responsibilities

| Responsibility | Requirements | Sprint and verification |
|---|---|---|
| Authentication, session lifecycle, and secret handling | FR-01, NFR-01, NFR-04 | Sprint 1 through F-01; API tests and configuration/repository review. |
| Backend permission, ownership, designated-Reviewer, and self-approval enforcement | BR-02 to BR-05, NFR-02 | Sprint 1 through F-02/F-03; negative API tests. Extend to resubmission, approval stages, and reports in Sprints 2/3. |
| Persistent request and decision data | FR-02, FR-06, NFR-03 | Sprint 1 through F-02/F-03; API/database write-and-read tests. Extend to multi-event history and reports in Sprints 2/3. |
| Local reproducible setup and synthetic demo accounts | NFR-03, NFR-04 | Sprint 1 README, Prisma migrations/seed, and local build/test evidence. |

## Coverage gaps and approved changes

- F-01 and F-02 are implemented and merged into `sprint-staging`; F-03 remains to be completed and verified.
- Sprint 1 uses one designated Reviewer authorized for the department's request scope. F-03 must enforce this policy; a role check alone is insufficient to reject an unrelated Reviewer.
- Existing tests do not directly prove cross-Requester record denial, unrelated Reviewer denial, self-approval denial, or a Requester attempting a review operation. Add these tests for Sprint 1. F-03 also needs a decision-reason field and migration; update the Part C data model when that design is finalized.
- F-04, F-05, and F-06 represent the theme's later-sprint work: return/resubmission, additional stages, filtering, and decision summaries/reporting. They are planned, not implemented for Deliverable 1.
- No approved changes to the master scope are recorded. If the team changes scope, record the date and rationale and update the SRS, traceability, sprint plan, and affected contracts together.