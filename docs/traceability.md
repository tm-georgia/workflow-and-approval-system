# Part B — Requirements Traceability

## Existing baseline allocation

Existing requirement IDs and Sprint 1 allocations are preserved; BR-05/BR-06 add the resolved assignment/self-approval rules. The following table retains the verification targets; the executed evidence table below records actual local results separately from pending review/release acceptance.

| Requirement | Covered by | Sprint | How it will be checked |
|---|---|---|---|
| FR-01 | F-01 | Sprint 1 | Test sign-in, sign-out, and current-user identity |
| FR-02 | F-02 | Sprint 1 | Test that a Requester can submit a request |
| FR-03 | F-02 | Sprint 1 | Test that a Requester can retrieve their own request |
| FR-04 | F-03 | Sprint 1 | Test that a Reviewer can view pending requests |
| FR-05 | F-03 | Sprint 1 | Test approval and rejection |
| FR-06 | F-03 | Sprint 1 | Test that a saved decision can be retrieved |
| BR-01 | F-02 | Sprint 1 | Test that a new request starts as Pending |
| BR-02 | F-02 | Sprint 1 | Test that a Requester cannot view another Requester's request |
| BR-03 | F-03 | Sprint 1 | Test that a Requester cannot decide a request |
| BR-04 | F-03 | Sprint 1 | Test that a decided request cannot be decided again |
| BR-05 | F-02, F-03 | Sprint 1 | Test server assignment, unassigned/unrelated Reviewer refusal, and missing/non-Reviewer designated account |
| BR-06 | F-03 | Sprint 1 | Test explicit self-approval refusal even after a Requester's role changes |
| NFR-01 | F-01 | Sprint 1 | Test that signed-out access is rejected |
| NFR-02 | F-01, F-02, F-03 | Sprint 1 | Test backend authentication/role middleware, Requester ownership restrictions, and Reviewer permissions |
| NFR-03 | F-02, F-03 | Sprint 1 | Test that saved requests and decisions can be retrieved |

## Executed Sprint 1 evidence - 12 November 2026

All PASS entries below refer to the uncommitted local implementation indexed in [verification.md](sprints/sprint-1/verification.md), on base commit `4326e6e`, with Node 24.15 and isolated PostgreSQL 18.4. They do not imply teammate acceptance, main integration, or a released version. Feature-local AC/test IDs retain their namespaces. Full test names, input/expected-result specifications, and mappings are in the three contracts; the report contains commands/counts/log references and file hashes.

| Requirement | Feature / AC | Planned test or verification | Actual file / test-name reference | Result |
|---|---|---|---|---|
| FR-01 | F-01 / AC-01-AC-04 | Login, current identity, invalid login, logout | `server/test/requests.test.ts`: `TEST-02`, `TEST-03`, `TEST-AUTH-ME-01`, `TEST-AUTH-INVALID-01`; original UI `TEST-UI-01` | PASS |
| FR-02, BR-01 | F-02 / AC-01, AC-05 | F-02 TEST-01, TEST-05 | Existing backend `TEST-03`; `server/test/reviewer.test.ts`: `TEST-F02-VALIDATION` (four cases); `client/src/RequesterEvidence.test.tsx`: `TEST-F02-UI-SUCCESS` | PASS |
| FR-03 | F-02 / AC-02-AC-04 | F-02 TEST-02-TEST-04 | Existing backend `TEST-03`; new `TEST-F03-10-SUBMIT`, `TEST-F02-OWNERSHIP`, combined `TEST-F03-02/03/04` | PASS |
| FR-04 | F-03 / AC-01, AC-10, AC-11 | TEST-F03-01, TEST-F03-10, TEST-F03-11 | `server/test/reviewer.test.ts`: same named families plus `TEST-F03-EMPTY`; UI `TEST-F03-UI-01/04` | PASS |
| FR-05 | F-03 / AC-02, AC-03, AC-07-AC-09 | TEST-F03-02/03/07/08/09 | Combined approval/rejection cases; invalid ID/value/missing/JSON cases; concurrency; `client/src/ReviewerWorkspace.test.tsx` action/error/duplicate cases | PASS |
| FR-06 | F-03 / AC-04 | TEST-F03-04 and built-server restart retrieval | Combined API/Prisma/owner checks; `TEST-F03-UI-OWNER`; `server/scripts/smoke.mjs` | PASS |
| BR-02 | F-02 / AC-02, AC-04 | F-02 TEST-02, TEST-04 | Existing `TEST-03`; `TEST-F03-10-SUBMIT`; `TEST-F02-OWNERSHIP` | PASS |
| BR-03 | F-03 / AC-05 | TEST-F03-05 | Both GET/PATCH paths denied signed out or as Requester; built HTTP forbidden operation | PASS |
| BR-04 | F-03 / AC-06, AC-08 | TEST-F03-06, TEST-F03-08 | Both terminal-state refusals and real PostgreSQL concurrent updates; built HTTP repeat refusal | PASS |
| BR-05 | F-02/F-03 / F-03 AC-10 | TEST-F03-10 and submission/unavailable variants | `TEST-F03-10`, `TEST-F03-10-SUBMIT`, `TEST-F03-10-UNAVAILABLE`, `TEST-F03-10-WRONG-ROLE`; unit `TEST-F03-UNIT-01` | PASS |
| BR-06 | F-03 / AC-11 | TEST-F03-11 | API list/PATCH self-owner case; unit `TEST-F03-UNIT-01` | PASS |
| NFR-01 | F-01/F-02/F-03 / F-01 AC-05, F-03 AC-05 | Signed-out/invalid-session protected access | Existing `TEST-01`, `TEST-AUTH-INVALID-01`; `TEST-F03-05`, `TEST-F03-SESSION` | PASS |
| NFR-02 | F-01/F-02/F-03 / role, ownership, assignment, self-owner AC | Backend negative access checks | Existing `TEST-04`; `TEST-F02-OWNERSHIP`; `TEST-F03-05/10/11`; unit permission checks | PASS |
| NFR-03 | F-02/F-03 / F-02 AC-01-AC-03, F-03 AC-04/06/08 | Actual database save/retrieval and application restart | Existing `TEST-03`; combined `TEST-F03-02/03/04`; concurrency; built-server persistence smoke | PASS |

The API/database checks above connect to real PostgreSQL. Frontend checks simulate API responses and establish UI behavior only. No performance targets or measurements are invented. Cloud persistence, independent UAT, and release acceptance remain separate later/lab gates.

## Proposed later-sprint traceability - pending team approval

F-04-F-07 are proposed feature IDs in the [inventory](features.md), not approved baseline scope. Existing requirement links below show related behavior or shared obligations; they do not imply that FR-01-FR-06 already specify the proposed features completely. New FR/BR definitions and stable IDs must be agreed and added to the SRS before these rows can become complete baseline traceability. No new requirement IDs are invented here.

| Proposed behavior / missing requirement definition | Proposed feature | Proposed sprint and dependency | Existing related requirements | Proposed verification target - not executed |
|---|---|---|---|---|
| Persist decision reasons and retrieve an ordered history; define required reasons, event details, visibility, and preservation. | F-04 | Sprint 2; F-01, F-02, F-03 | FR-06, NFR-01, NFR-02, NFR-03 | API/database integration: retrieve saved reasons/history after a new request; verify event ordering and access restrictions. Decide mandatory-reason and history-preservation rules before specifying negative tests. |
| Return a pending request, allow its owner to correct/resubmit it, and preserve earlier history; define legal transitions and editable fields. | F-05 | Sprint 2; F-01, F-02, F-03, F-04 | FR-02-FR-06, BR-02, NFR-01-NFR-03 | UI/API/database journey: return -> owner correction -> resubmission -> review. Test invalid transitions, wrong owner/role, saved state, and preserved prior history against the agreed rules. |
| Filter an authorized request list; define fields, combinations, validation, and no-match behavior. | F-06 | Sprint 3; F-01, F-02, F-03; F-05 for any new workflow states | FR-03, FR-04, BR-02, NFR-01, NFR-02 | Seed known records; verify matching/no-match/invalid filters and ensure a filter cannot expose another Requester's or an unauthorized Reviewer's records. |
| Report decision summaries from persisted records; define audience, measures, date boundaries, and resubmission counting. | F-07 | Sprint 3; F-01, F-03, F-04, F-05 | FR-06, NFR-01, NFR-02, NFR-03 | Seed known decisions; compare report results with agreed expected values, including empty data and date boundaries. Verify access scope and correct handling of return/resubmission history. |

All proposed features must retain authentication and server-side permissions. F-04/F-05 require database-backed persistence checks; F-06/F-07 must query authorized persisted data. Extend the approved NFR verification allocation after team approval; later checks supplement rather than replace Sprint 1 verification.

## Remaining traceability work before Part D is finalized

- Record the team's feature/sprint decision and reconcile the new FR/BR definitions with the teacher's full Theme 5 scope; update Parts A/C and feature contracts through a separately authorized task.
- Preserve the resolved Sprint 1 assignment/self-approval/minimum-history rules (BR-05/BR-06 and F-03). F-04 must not absorb those existing Sprint 1 obligations.
- Reconcile BR-04 with any approved resubmission cycle explicitly. Its current wording and the rule against repeated decisions must not be silently weakened to support F-05; specify when a new pending review cycle may begin and how history is preserved.
- For each approved feature, link requirement -> feature -> sprint -> AC -> planned test -> actual test file/name -> execution result and tested version. Proposed verification targets above have no assigned AC/test IDs or execution evidence yet.
- Local F-03 contract/implementation/tests, cross-Requester privacy verification, F-01 rerun, and F-02 mapping are now completed. Remaining evidence gates are teammate review, versioned history, integration/release, and final submission packaging; see Product DoD/report.
- Give approved tasks owners and dates. All Sprint 2 work must be complete and at least one meaningful Sprint 3 workflow/rule implemented and tested by 29 November; complete the agreed product by 13 December.
