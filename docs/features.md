# Part B — Feature Inventory

This inventory covers the selected Theme 5 product baseline across all three sprints. Sprint 1 implementation is identified separately from later planned work. Later features receive requirement and sprint allocation now; their detailed contracts and executable tests are prepared before implementation in their sprint.

| ID | Feature | Requirements | Sprint | Dependencies and completion outcome |
|---|---|---|---|---|
| F-01 | Sign in/out and retrieve current identity | FR-01, NFR-01, NFR-02, NFR-04 | Sprint 1 | Seeded accounts and database. User session identity is enforced by the API. |
| F-02 | Submit a request and view its own status | FR-02, FR-03, BR-01, BR-02, BR-05, NFR-01–03 | Sprint 1 | F-01. Save a Pending request under the signed-in Requester and retrieve only that Requester's records. |
| F-03 | Review assigned pending requests and approve/reject | FR-04–06, BR-03–06, NFR-01–03 | Sprint 1 | F-01, F-02, PostgreSQL. Save status, deciding Reviewer, and decision time; reject unauthorized/self/repeated decisions. |
| F-04 | Save decision reasons and ordered review history | FR-07, BR-07, NFR-01–04 | Sprint 2 | F-01–03. Add persisted reason/history events and authorized retrieval. |
| F-05 | Return a request and allow owner correction/resubmission | FR-08, BR-08, NFR-01–03 | Sprint 2 | F-04 history. Preserve earlier events and test valid/invalid state transitions. |
| F-06 | Filter authorized request lists | FR-09, NFR-01–03 | Sprint 3 | F-01–05. Filters must not widen the user's record access. |
| F-07 | Provide decision summaries and reports | FR-10, BR-09, NFR-01–04 | Sprint 3 | F-04–06. Summaries use persisted decisions and respect authorization. |

## Cross-cutting responsibilities

| Responsibility | Requirements | Sprint and verification |
|---|---|---|
| Authentication and secret handling | FR-01, NFR-01, NFR-04 | Sprint 1 F-01; valid/invalid login, logout, current identity, protected access, and configuration inspection. |
| Backend role, assignment, ownership, and self-approval enforcement | BR-02–06, NFR-02 | Sprint 1 F-01–03; API/database negative tests. Extend tests for F-05/F-06/F-07 later. |
| Persistent requests and decisions | FR-02, FR-06, NFR-03 | Sprint 1 F-02/F-03; write/read and restart checks. Extend to event history in Sprint 2. |
| Reproducible setup and synthetic accounts | NFR-03/NFR-04 | Sprint 1 README, migrations, seed procedure, and local build/test evidence. |

## Coverage and scope decisions

All Theme 5 capabilities are allocated: reasons/history and return/resubmission are Sprint 2; filtering and decision summaries are Sprint 3. This project uses one approval stage and one server-designated Reviewer for the selected department purchase context. These decisions specialize the theme; they do not claim that later features are already implemented.

Sprint 1 F-01/F-02 contracts retain their accurate retrospective-history disclosure. Sprint 1 completion and test evidence are in the feature contracts and verification documents. Later features need their own approved feature contract, AC, STS, and DoD before implementation.
