# Part B — Requirements Traceability

Each baseline requirement is assigned to a feature and sprint. Sprint 1 rows identify the existing acceptance/test evidence. Later-sprint rows define verification targets; their detailed AC and executable tests will be recorded in those feature contracts before implementation.

| Requirement | Feature | Sprint | Planned verification / current evidence |
|---|---|---|---|
| FR-01 | F-01 | 1 | F-01 AC-01–AC-06; login, invalid login, current identity, logout, and protected access tests in `server/test/requests.test.ts`. |
| FR-02, BR-01 | F-02 | 1 | F-02 AC-01, AC-05–AC-07; backend TEST-03 verifies saved PENDING request; UI submission journey is TEST-UI-01; CHG-001 TEST-06 verifies successful submission remains acknowledged and displays a separate warning when history refresh fails. |
| FR-03, BR-02 | F-02 | 1 | F-02 AC-02–AC-04 and AC-08–AC-11; requester ownership/privacy API tests verify access boundaries. CHG-001 TEST-07 verifies successful history retry and warning clearance; TEST-08 verifies history preservation after retry failure; TEST-09 verifies retry loading feedback. |
| FR-04, BR-03, BR-05 | F-03 | 1 | F-03 AC-01/10; assigned queue, wrong-role/unassigned Reviewer, and server-assignment tests in `server/test/reviewer.test.ts`. |
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

### CHG-001 — Requester history recovery test mapping

| Acceptance criterion | Test ID | Verification coverage |
|---|---|---|
| AC-06, AC-07 | TEST-06 | Successful submission remains acknowledged when the subsequent history GET fails; a separate history-refresh warning appears. |
| AC-08, AC-10 | TEST-07 | Requester retries history retrieval; successful retrieval updates history and clears the warning without another POST. |
| AC-11 | TEST-08 | Failed history retry preserves previously displayed history and keeps the warning visible. |
| AC-09 | TEST-09 | Retry displays loading feedback and prevents duplicate retry actions. |
| AC-08 | TEST-07, TEST-08 | The no-resubmission behavior is covered by assertions verifying only one POST. There is no separate executable TEST-10. |

## Status and scope

F-01, F-02, and F-03 are implemented and integrated into the Sprint 1 workflow on `sprint-staging`.

The earlier Sprint 1 verification report records 55 backend and 19 frontend tests passing on the tested local version, together with builds/typechecks and database-backed restart smoke checks. These results represent the earlier Sprint 1 verification baseline.

CHG-001 extends F-02 with Requester history recovery. Its implementation was approved and merged into `sprint-staging` through PR #52 on 28 November 2026 (merge commit `5328f22`).

CHG-001 verification recorded:
- 27 client tests passed across 4 test files.
- The production client build completed successfully.
- Browser verification confirmed that a successful submission remains acknowledged when history retrieval fails.
- A successful history retry updated the displayed request history and cleared the warning without submitting another request.

The 27 client tests are a separate CHG-001 verification run and must not be added to the earlier 55 backend and 19 frontend test counts as though they were one test run.

F-04–F-07 are planned, not implemented. Decision reasons and extended history are deliberately allocated to Sprint 2; this preserves the existing Sprint 1 behavior while covering the Theme 5 requirement in the full product baseline. The selected workflow has one approval stage. If the team or instructor changes these decisions, update the SRS, feature inventory, plan, SDS, and affected contracts together.

Final release verification on `main` remains a separate step.