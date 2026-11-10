# Part B — Feature Inventory

## Confirmed Sprint 1 scope

| Feature ID | Feature | Related requirements | Sprint | Dependency |
|---|---|---|---|---|
| F-01 | Sign in, sign out, and identify the current user | FR-01, NFR-01, NFR-02 | Sprint 1 | None |
| F-02 | Submit a request and let the Requester view its status | FR-02, FR-03, BR-01, BR-02, NFR-02, NFR-03 | Sprint 1 | F-01 |
| F-03 | Let a Reviewer view and decide pending requests | FR-04, FR-05, FR-06, BR-03, BR-04, NFR-02, NFR-03 | Sprint 1 | F-01, F-02 |

These remain the confirmed Sprint 1 features. The NFR-02 links identify authentication/role middleware in F-01 and ownership enforcement in F-02 as shared responsibilities; they do not change the requirement or establish passing verification.

## Proposed later-sprint scope - pending team approval

The following IDs are proposed identifiers for review, not approved baseline additions or claims of implementation. The proposed split follows the team's suggested feature set. No approval is recorded yet. Existing FR/BR IDs remain unchanged; the SRS does not yet define the new behavior fully.

| Proposed feature ID | Proposed feature and completion outcome | Requirement links and gaps | Proposed sprint | Dependency |
|---|---|---|---|---|
| F-04 | Decision reasons and history: persist the reason and an ordered record of review actions, and let authorized users retrieve them. | Extends FR-06; applies NFR-01, NFR-02, NFR-03. New FR/BR definitions are needed for reasons, recorded events, history visibility, and preservation. | Sprint 2 | F-01, F-02, F-03 |
| F-05 | Return and resubmit a request: an authorized Reviewer returns a pending request with a reason; its Requester corrects and resubmits it for review while earlier decisions/history remain available. | Extends the workflow addressed by FR-02-FR-06; applies BR-02 and NFR-01-NFR-03. New FR/BR definitions are needed for return/resubmission, allowed edits, and transitions. | Sprint 2 | F-01, F-02, F-03, F-04 |
| F-06 | Request filtering: users narrow their authorized request list using agreed filters without widening their record access. | Relates to FR-03/FR-04 and NFR-01/NFR-02. New FR/BR definitions are needed for filter fields, combinations, and behavior. | Sprint 3 | F-01, F-02, F-03, F-05 for filtering any newly introduced workflow states |
| F-07 | Decision reporting: show agreed decision summaries calculated from persisted records within the viewer's authorized scope. | Relates to FR-06 and NFR-01-NFR-03. New FR/BR definitions are needed for report audience, measures, date boundaries, and treatment of resubmissions. | Sprint 3 | F-01, F-03, F-04, F-05 |

Implement F-04 before the history-dependent F-05 work. Preserve the minimum decision/history entry required in F-03 for Sprint 1; proposing richer F-04 history later does not defer that Sprint 1 obligation. Sprint 3 must include an implemented and tested F-06 or F-07 domain workflow/rule by 29 November, with all agreed scope complete by 13 December.

Before approval, agree whether reasons are mandatory for approval, rejection, and return; which history events and details each role may view; return/resubmission and editing rules; filter fields; and report calculations/access. Reviewer assignment/authorization and self-approval prevention remain outstanding Sprint 1 decisions. Multi-stage approval is not included in this proposal; confirm whether the chosen context requires it or instructor/TA agreement for a scope variation.

After approval, record the decision and update the SRS, System-Level SDS, feature contracts, and [traceability](traceability.md) before implementation. Finalize [Part D](sprints/plan.md) only after this baseline reconciliation. No new AC/test IDs, endpoint paths, or schema decisions are approved by this inventory.
