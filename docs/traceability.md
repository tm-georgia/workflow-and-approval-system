# Part B — Requirements Traceability

Each baseline requirement is assigned to a feature and sprint. Sprint 1 rows identify the existing acceptance/test evidence. Later-sprint rows define verification targets; their detailed AC and executable tests will be recorded in those feature contracts before implementation.

| Requirement | Feature | Sprint | Planned verification / current evidence |
|---|---|---|---|
| FR-01 | F-01 | 1 | F-01 AC-01–AC-06; login, invalid login, current identity, logout, and protected access tests in server/test/requests.test.ts. |
| FR-02, BR-01 | F-02 | 1 | F-02 AC-01, AC-05–AC-07; backend TEST-03 verifies saved PENDING request; UI submission journey is TEST-UI-01; TEST-06 verifies that successful submission remains acknowledged when history refresh fails. |
| FR-03, BR-02 | F-02 | 1 | F-02 AC-02–AC-04 and AC-08–AC-11; requester ownership/privacy API tests, plus TEST-06–TEST-10 for history-refresh warning, retry, loading feedback, and history recovery. |
| FR-04, BR-03, BR-05 | F-03 | 1 | F-03 AC-01/10; assigned queue, wrong-role/unassigned Reviewer, and server-assignment tests in server/test/reviewer.test.ts. |
| FR-05, BR-04, BR-06 | F-03 | 1 | F-03 AC-02/03/05–08/11; approval/rejection, wrong-role, self-approval, repeat, invalid, and concurrent-decision tests. |
| FR-06 | F-03 | 1 | F-03 AC-04; database read-back, Requester retrieval, and built-server restart smoke check. |
| FR-07, BR-07 | F-04 | 2 | Planned: test that each decision reason is required, saved with its event, ordered, and retrievable only by authorized roles. |
| FR-08, BR-08 | F-05 | 2 | Planned: UI/API/database return → owner edit/resubmit → review journey; test wrong owner, invalid transitions, and preservation of earlier history. |
| FR-09 | F-06 | 3 | Planned: matching/no-match/invalid filter tests and proof that filters preserve role and ownership boundaries. |
| FR-10, BR-09 | F-07 | 3 | Planned: compare reports against known persisted decisions, including empty/date-boundary cases and authorization scope. |
| NFR-01 | F-01, F-02, F-03 | 1; extend in 2–3 | Signed-out protected endpoints return 401 without private data; extend for later endpoints. |
| NFR-02 | F-01–F-03; extend in 2–3 | 1; extend in 2–3 | Role, ownership, assignment, and self-approval tests; later workflows/reports retain the same API enforcement. |
| NFR-03 | F-02, F-03 | 1; extend in 2–3 | F-02 TEST-03 verifies a submitted request can be retrieved; F-03 decision tests verify status/Reviewer/time read-back, and the built-server smoke check verifies persistence after application restart. Extend persistence checks to history and reporting in Sprints 2–3. |
| NFR-04 | F-01, F-04, F-07 | 1–3 | Password hashes, no secrets in client/API/Git, and safe report behavior; verify by tests and repository inspection. |

## Status and scope

F-01, F-02, and F-03 are implemented and present in the locally inspected sprint-staging history. The verification report records 55 backend and 19 frontend tests passing on the tested local version; the final release version must be verified again after integration.

F-04–F-07 are planned, not implemented. Decision reasons and extended history are deliberately allocated to Sprint 2; this preserves the existing Sprint 1 behavior while covering the Theme 5 requirement in the full product baseline. The selected workflow has one approval stage. If the team or instructor changes these decisions, update the SRS, feature inventory, plan, SDS, and affected contracts together.