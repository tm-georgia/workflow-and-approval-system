# Part B — Requirements Traceability

## Existing baseline allocation

The checks below are verification targets, not recorded passing results. Existing requirement IDs and Sprint 1 allocations are preserved.

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
| NFR-01 | F-01 | Sprint 1 | Test that signed-out access is rejected |
| NFR-02 | F-01, F-02, F-03 | Sprint 1 | Test backend authentication/role middleware, Requester ownership restrictions, and Reviewer permissions |
| NFR-03 | F-02, F-03 | Sprint 1 | Test that saved requests and decisions can be retrieved |

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
- Define reviewer assignment/authorization, self-approval prevention, and the minimum F-03 decision/history entry within Sprint 1. F-04 must not absorb missing Sprint 1 requirements.
- Reconcile BR-04 with any approved resubmission cycle explicitly. Its current wording and the rule against repeated decisions must not be silently weakened to support F-05; specify when a new pending review cycle may begin and how history is preserved.
- For each approved feature, link requirement -> feature -> sprint -> AC -> planned test -> actual test file/name -> execution result and tested version. Proposed verification targets above have no assigned AC/test IDs or execution evidence yet.
- Retain the known existing evidence gaps: missing F-03 contract/implementation/tests, cross-Requester privacy verification, F-01's pending test rerun, and the F-02 planned-test-to-actual-test mapping.
- Give approved tasks owners and dates. All Sprint 2 work must be complete and at least one meaningful Sprint 3 workflow/rule implemented and tested by 29 November; complete the agreed product by 13 December.
