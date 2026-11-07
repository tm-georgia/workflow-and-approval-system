# Part B — Requirements Traceability

| Requirement | Feature / responsibility | Sprint | Verification / current status |
|---|---|---|---|
| FR-01 — Sign in/out and retrieve current identity | F-01 | Sprint 1 | Existing `server/test/requests.test.ts`: `TEST-02`, `TEST-03`, `TEST-AUTH-ME-01`, `TEST-AUTH-INVALID-01`; UI `client/src/App.test.tsx`: `TEST-UI-01`. |
| FR-02 — Requester submits a request | F-02 | Sprint 1 | Existing `server/test/requests.test.ts`: `TEST-03` checks persistence and Pending status; UI `TEST-UI-01` exercises submission with a simulated API. |
| FR-03 — Requester views own requests/status | F-02 | Sprint 1 | `TEST-03` retrieves the created request; `TEST-UI-01` shows Pending. Add a direct cross-Requester record-access test. |
| FR-04 — Designated Reviewer views authorized pending requests | F-03 | Sprint 1 | Planned F-03 API/database tests: designated Reviewer succeeds; unrelated Reviewer and Requester are denied. Add stable IDs in the F-03 contract. |
| FR-05 — Reviewer approves/rejects | F-03 | Sprint 1 | Planned positive API/database tests for both decisions, actor identity, required reason, and no self-approval. |
| FR-06 — Saved review result can be retrieved | F-03 | Sprint 1 | Planned integration test: decide a request, read it back, and verify status, reviewer, decision time, and reason. |
| FR-07 — Reviewer returns request with reason | F-04 | Sprint 2 | Define return-state and reason tests in the F-04 contract before implementation. |
| FR-08 — Requester revises/resubmits returned request | F-04 | Sprint 2 | Define owner/state validation and retained-history tests in the F-04 contract. |
| FR-09 — Additional ordered approval stages | F-05 | Sprint 2 | Define stage-order, authorization, outcome, and history tests in the F-05 contract. |
| FR-10 — Filter authorized requests | F-06 | Sprint 3 | Define filter-result and role/ownership tests in the F-06 contract. |
| FR-11 — Decision summaries/reports | F-06 | Sprint 3 | Define summary correctness and permission-scope tests in the F-06 contract. |
| BR-01 — New request starts Pending | F-02 | Sprint 1 | `TEST-03` expects `PENDING`; UI `TEST-UI-01` displays `PENDING`. |
| BR-02 — Requester accesses only own requests | F-02 / ownership responsibility | Sprint 1 | `TEST-03` shows client-supplied requester ID is ignored. Add a test where Requester A attempts to retrieve Requester B's record; this exact case is not covered yet. |
| BR-03 — Only designated Reviewer may act in the review scope | F-03 / authorization responsibility | Sprint 1 | Planned tests: designated Reviewer can access; a second unrelated Reviewer cannot. `TEST-04` only checks Reviewer denial from the Requester-only list and is not sufficient for this rule. |
| BR-04 — No self-approval | F-03 | Sprint 1 | Planned test: request owner attempts to decide own request; expect forbidden response and no database change. |
| BR-05 — Only Pending requests can be approved/rejected | F-03 | Sprint 1 | Planned test: make one decision, then attempt another; expect rejection and original saved decision unchanged. |
| BR-06 — Decision is recorded | F-03 | Sprint 1 | Planned database test checks final status, acting Reviewer ID, decision timestamp, and reason after retrieving the request. |
| BR-07 — Return/resubmit only by owner and in allowed state | F-04 | Sprint 2 | Define positive and forbidden/boundary tests before implementation. |
| BR-08 — Approval stages occur in order | F-05 | Sprint 2 | Define test for a later-stage action before earlier approval; expect rejection and no state change. |
| BR-09 — Reports respect access scope | F-06 | Sprint 3 | Define report data-scope tests before implementation. |
| NFR-01 — Signed-out protected access is rejected | F-01 / authentication responsibility | Sprint 1 | Existing `TEST-01` expects HTTP `401`; `TEST-AUTH-INVALID-01` verifies invalid login leaves `/api/auth/me` unauthorized. |
| NFR-02 — Backend enforces role, ownership, reviewer authorization, and self-approval | F-01, F-02, F-03; extend F-04/F-05/F-06 | Sprints 1–3 | Existing `TEST-04` checks only the Reviewer-to-Requester-list restriction. Add the cross-user, unrelated-Reviewer, Requester-review, and self-approval tests in Sprint 1; extend for later workflows and reports. |
| NFR-03 — Request/decision data persists | F-02, F-03; extend F-04/F-05/F-06 | Sprints 1–3 | `TEST-03` verifies request persistence. Add F-03 decision persistence test; extend for event history and reporting. |
| NFR-04 — Passwords and secrets protected | F-01 / security responsibility | Sprint 1 | Verify bcrypt password hashes, safe API responses, and no real secrets in Git or client code. |

## Coverage gaps and scope changes

1. F-03 implementation and its tests for designated Reviewer access, self-approval, Requester review denial, invalid transitions, and decision persistence are outstanding.
2. The current tests do not directly demonstrate that one Requester cannot retrieve another Requester's record. Add this test before claiming full BR-02 verification.
3. Existing request creation does not store a per-request Reviewer assignment. The agreed Sprint 1 policy is that one designated Reviewer is authorized for the entire department scope; F-03 must enforce that identity. If the instructor requires an explicit per-request assigned ID, update the design and implementation.
4. The current Request record stores one final status, Reviewer ID, and decision time, but has no decision-reason field. F-03 must add that field and a migration; update the Part C data model. Sprint 2 must extend the record to multi-event history for returned requests and additional stages.
5. Later-sprint requirements have feature and sprint allocations now; their detailed AC and executable tests are due before implementation in their respective sprints.
6. No approved scope changes are recorded. Document any future change with its date and rationale.