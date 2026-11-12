# Part D - Three-Sprint Plan

**Status:** Draft for human review, prepared 11 November 2026. F-01, F-02, and F-03 retain their existing Sprint 1 allocation. F-04-F-07 now identify the team's suggested later-sprint scope in the inventory and traceability, with the allocation below proposed for approval. No later-sprint scope approval is recorded. This draft does not establish that any sprint has been accepted or released.

**12 November 2026 local revision:** F-03's assignment policy was resolved explicitly with the user; Reviewer functionality, tests, and Part E documentation are now implemented and verified locally. See [the verification report](sprint-1/verification.md). Later-sprint proposals and published deadlines are unchanged; reviewed integration/release remain pending.

## 1. Sources and planning basis

Repository sources reviewed:

- [SRS](../srs.md): FR-01 through FR-06, BR-01 through BR-06 (including the resolved assignment/self-approval rules), NFR-01 through NFR-03, exclusions, and open later-scope questions.
- [Feature inventory](../features.md) and [traceability](../traceability.md): confirmed F-01, F-02, and F-03 remain allocated to Sprint 1; proposed F-04-F-07 and their later-sprint allocation are explicitly pending team approval and new SRS definitions.
- [System-Level SDS](../system-sds.md): React/TypeScript/Vite client, Express/TypeScript API, PostgreSQL/Prisma persistence, cookie authentication, assignment/permissions, and implemented local F-03 behavior.
- Sprint 1 contracts: [F-01](sprint-1/F-01-authentication.md), [F-02](sprint-1/F-02-requester.md), and the now-present [F-03](sprint-1/F-03-reviewer.md). The original 11 November review preceded the local F-03 draft; it is no longer missing.
- Read-only implementation checks: `client/src/App.tsx`, `client/src/App.test.tsx`, `server/src/auth.ts`, `server/src/requests.ts`, `server/src/app.ts`, `server/test/requests.test.ts`, and `server/prisma/schema.prisma`.

The teacher's specification **is available locally**, outside the repository:

| Local source | Relevant sections |
|---|---|
| `C:/Users/ASUS/Downloads/project_deliverable_1_v1.pdf` | Section 3.4, page 3: Part D requires each sprint's goal, feature IDs, dependencies, and completion outcome; together the sprints must cover the product baseline. Sections 2, 3.5, 3.6, and 4 specify Sprint 1 and its evidence. |
| `C:/Users/ASUS/Downloads/group_project_spec_files.zip` -> `group_work_specs_v1.pdf` | Sections 4-5: dates and common technical requirements; section 6, Theme 5, page 6: approval workflow and access expectations; section 7: three-sprint model; sections 8 and 10: engineering workflow and labs. |
| Same ZIP -> `project_deliverable_2_v1.pdf` | Sections 2 and 3: complete Sprint 2, tested Sprint 3 progress, updated traceability, and an integrated deployed candidate by 29 November. |
| Same ZIP -> `project_final_delivery_v1.pdf` | Sections 2 and 3: complete the agreed scope, verify the final version, and deliver the deployed product by 13 December. |

The standalone Deliverable 1 PDF is byte-for-byte identical to its ZIP copy. The group specification identifies itself as a draft for instructor review, issued 6 October 2026. Deliverable 1 refers to a master `group_work_specs.docx`; that file was not found in the inspected project/Downloads locations. The available PDF is the planning source; confirm whether a newer instructor-approved revision exists. These external source files were read without being copied or modified.

## 2. Sprint allocation and checkpoints

The following dates come from the local teacher documents, not an assumed equal-length sprint calendar. The group specification sets submission deadlines at 23:59 on the listed dates. They are recorded here in the course's local context (Asia/Bangkok). Sprint start dates, task owners, effort estimates, and a revised completion schedule are not recorded in the repository.

| Sprint | Goal | Included feature IDs supported by the repository | Dependencies | Required completion outcome and checkpoint |
|---|---|---|---|---|
| Sprint 1 | Deliver a small working approval journey with real authentication, server permissions, and database persistence. | **F-01, F-02, F-03** | PostgreSQL, Prisma migrations and synthetic seeded accounts; F-02 depends on F-01 and assignment schema/configuration; F-03 review depends on F-01/F-02. Design is resolved in its contract and BR-05/BR-06. | Deliverable 1, **8 November 2026**: complete workflow, tests, reviewed integration, and an identifiable local release on main. Local implementation/verification completed on 12 November; review, submission history, integration, and accepted release remain pending. |
| Sprint 2 | Complete the core product expansion under feature engineering contracts, preserving Sprint 1 behavior. | **Proposed: F-04 (decision reasons/history), F-05 (return/resubmission).** Pending team approval and baseline reconciliation; see section 6. F-01-F-03 remain Sprint 1 features. | Accepted Sprint 1 workflow; approved requirements and contracts; F-04 precedes history-dependent F-05 work; delivery pipeline established through Lab 5; relevant UAT/change findings. | Deliverable 2, **29 November 2026**: all approved Sprint 2 features implemented, reviewed, integrated, and verified, including persisted history and the return/resubmission journey if approved; identifiable Sprint 2 release plus a deployed integrated candidate. |
| Sprint 3 | Deliver the remaining approved features and harden the integrated product: failure handling, usability, authorization, regression verification, and defect correction. | **Proposed: F-06 (request filtering), F-07 (decision reporting).** Pending team approval and baseline reconciliation. Hardening remains a system responsibility. | Approved allocation and contracts; F-06 uses authorized request lists and any F-05 states; F-07 uses F-04/F-05 decision history; lab defect/change records and reproducible deployment. Begin domain work before 29 November. | **29 November 2026:** all remaining contracts and at least one meaningful implemented and tested Sprint 3 domain workflow or rule, proposed from F-06/F-07; explicit remaining work. **13 December 2026:** complete scope, final verification, accepted deployed release, final report, and demonstration video. |

The Sprint 1 deadline has already passed as of this draft. No release or submission evidence was established by this review; the team must record actual status and recovery dates without changing the teacher's published deadlines. Sprint 1 omissions must remain visible as Sprint 1 incompleteness unless a scope revision is approved. They must not be relabeled as new Sprint 2 features to imply Sprint 1 completion.

### Related lab checkpoints

These are delivery and verification responsibilities on the evolving application. They do not replace approval of the proposed product allocation or core expansion.

| Checkpoint | Teacher-supported responsibility | Dependency and outcome |
|---|---|---|
| Lab 5 - **15 November 2026** | Docker packaging, CI build/test gates, GCP deployment, and repeatable release pipeline. | Starts with the accepted Sprint 1 increment. Demonstrate the domain journey, blocked failing checks, and durable data after restart/redeployment. Completed Docker/CI/CD/GCP setup is not required for Deliverable 1. |
| Lab 6 - **22 November 2026** | Independent cross-team UAT, defect triage, fixes, and independent re-test. | Use an identified released version and safe synthetic accounts/data. Feed accepted defects and their verification status into the ongoing sprint plan. |
| Lab 7 - **29 November 2026** | Instructor/TA-approved maintenance change, impact analysis, regression-safe delivery, metrics, and release readiness. | Applies to implemented behavior. A feature already in the baseline backlog alone does not satisfy the maintenance exercise. Track affected contracts/tests and redeploy the reviewed change. |

The teacher identifies **1-11 December** as the final examination period and expects the product to be substantially complete by 29 November. Reserve the remaining period for bounded completion, fixes, integration, and final verification; do not defer major workflows to the final two days. The team still needs named owners and dated actions for that schedule.

## 3. Sprint 1 scope and dependencies

The scope below preserves the inventory and existing contracts. Implementation presence is distinguished from executed verification and acceptance.

| Feature | Existing requirement links | Planned scope and dependency | Current repository evidence and outstanding outcome |
|---|---|---|---|
| **F-01 - Sign in, sign out, and identify the current user** | FR-01, NFR-01, NFR-02. | Foundation for F-02/F-03; seeded users, hashes, verified cookie identity, and role middleware. | Existing implementation/tests preserved and regression checks passed on 12 November, including the latest identity assertion. Retrospective contract history remains disclosed; review/integration are pending. |
| **F-02 - Submit a request and let the Requester view its status** | FR-02, FR-03, BR-01, BR-02, BR-05, NFR-01-NFR-03. | F-01 plus assigned-Reviewer schema/configuration. Session-owned submission and `/mine` retrieval. | Submission/retrieval, spoofed ownership, cross-Requester isolation, and invalid-field checks passed against PostgreSQL. UI success/decision metadata and detailed contract mappings added. Client title-length policy remains a disclosed team decision. |
| **F-03 - Let a Reviewer view and decide pending requests** | FR-04-FR-06, BR-03-BR-06, NFR-01-NFR-03. | F-01/F-02; one designated seeded Reviewer assigned by server; explicit non-self-owner and pending-only rules. | Contract, assigned pending API, conditional transactional decision API, Reviewer UI, unit/API/database/UI tests, and built-server restart smoke checks completed locally. Review/integration/release acceptance remain pending. |

### How the complete Sprint 1 journey must work

1. A seeded Requester signs in through the React UI. `POST /api/auth/login` checks the stored bcrypt hash and sets the HTTP-only `accessToken` cookie; `GET /api/auth/me` identifies the authenticated user. The existing lifecycle uses a one-hour JWT, `SameSite=Lax`, and `Secure` in production; logout clears the cookie. Missing/invalid sessions are refused by the API.
2. The Requester submits a title and description through `POST /api/requests`. The Express API validates the fields, enforces `REQUESTER`, and uses the authenticated identity for `requesterId`. Prisma writes the request to PostgreSQL with `PENDING`, satisfying BR-01. `GET /api/requests/mine` retrieves only the owner's requests, satisfying BR-02.
3. After sign-out, the assigned seeded Reviewer signs in. The implemented F-03 UI loads `/api/requests/pending`. The API enforces `REVIEWER`, persisted assignment (BR-05), and non-self-ownership (BR-06); unrelated/unassigned records are excluded. The user approved this bounded assignment policy on 12 November.
4. The Reviewer approves or rejects a `PENDING` request through `PATCH /api/requests/:id/decision`. One conditional database write saves status, deciding identity, and time; repeated/concurrent attempts cannot replace it. These fields form the defined minimum Sprint 1 decision/history entry, not an extended event history or reason system.
5. The Requester signs in again and retrieves the same saved request through the UI/API. Its persisted decision is visible. Demonstrate approval and rejection on separate requests, as well as an invalid transition and forbidden access. Verify database-backed retrieval; a mocked UI response alone does not prove persistence.

This journey connects **UI -> API -> PostgreSQL** and changes domain state. Backend/PostgreSQL tests, selected mocked-API UI tests, and a built HTTP application-restart check now verify its local behavior. Product DoD review/integration/release gates remain incomplete; see the report for the exact evidence and limits.

### Sprint 1 completion evidence

- Meet the documented F-01/F-02/F-03 criteria; retain feature-local AC/test IDs. Current mappings and executed results appear in the contracts and traceability.
- Execute meaningful automated checks for valid/invalid sign-in, current-user identity/logout, signed-out access, wrong-role access, cross-Requester privacy, new `PENDING` status, approval/rejection, repeated/invalid decisions, and saved-result retrieval. Add the Theme 5 self-approval and unrelated-Reviewer checks after resolving their policies. A rejected operation must not mutate protected data.
- Retain API/database integration evidence, selected UI/end-to-end journeys, and build/test commands, counts, actual test names/files, and tested version. The original 11 November draft ran no tests; the 12 November implementation now has actual local verification indexed in the report. The tested working tree remains uncommitted.
- Follow the course Issue -> feature/fix branch -> teammate-reviewed sprint staging PR -> integration/acceptance checks -> reviewed main release process. Record the actual accepted tag/commit and both students' contributions. This is a future acceptance gate; preparing this draft performs none of those Git or external actions.
- Provide reproducible local dependencies, environment-variable names, migrations, seed, run/build/test instructions, and safe test access. Preserve the existing exclusions of self-registration, password recovery, and advanced account administration for this checkpoint. Keep real secrets out of submitted evidence.

## 4. Sprint 2 conditional scope and completion

**Goal:** deliver decision reasons/history and return/resubmission if approved, preserving Sprint 1 behavior. **Proposed feature IDs:** F-04 and F-05; no later-sprint approval is recorded. F-04 supplies the richer history used by F-05. Minimum Sprint 1 decision/history behavior remains in F-03.

Before later-sprint implementation, the team must approve the allocation, reconcile Theme 5's expectations with new SRS definitions, and prepare each feature's design, AC, STS, and DoD. Parts B/D still record proposed later scope only; Parts A/C now contain the resolved Sprint 1 rules/design but no approved later-sprint baseline additions. The proposed F-05 review cycle must be reconciled explicitly with BR-04 before a previously decided request can re-enter review.

Completion at 29 November requires every agreed Sprint 2 AC implemented and verified, meaningful persistent domain behavior, new permission/error/boundary checks, regression of F-01-F-03, teammate review, and an identifiable integrated release. Retain the original Sprint 2 release even when the Deliverable 2 candidate also contains Sprint 3 progress. Include relevant Lab 5-7 changes and unresolved defects with versions and re-test outcomes. Required work cannot be moved to Sprint 3 merely to mark Sprint 2 complete without an approved scope revision.

## 5. Sprint 3 conditional scope and completion

**Goal:** deliver request filtering and decision reporting if approved, finish the agreed product, and establish release readiness. **Proposed feature IDs:** F-06 and F-07; no later-sprint approval is recorded. The sprint must include genuine domain progress before the Deliverable 2 checkpoint; plan an implemented and tested F-06/F-07 workflow or rule, not only hardening.

By 29 November, all remaining feature contracts must exist and at least one meaningful Sprint 3 domain workflow or rule must be implemented and tested in the integrated candidate. Record exact remaining feature/AC or defect references, current status, dependency, owner, next action, target date, and tested version. Those names, IDs, and dates are unresolved in the current repository and must be supplied by the team.

By 13 December, complete the agreed baseline and approved changes; run final build, automated regression, API/database, selected acceptance, persistence, and role/ownership checks on the final version. Resolve accepted critical defects, perform relevant independent UAT re-tests, disclose remaining blockers/debt, and verify durable data after restart/redeployment. Deliver the accepted main release deployed on GCP, current setup/migration/configuration documentation, final traceability/results, report, and required demo video. Earlier passing results do not substitute for verification on the final version.

## 6. Proposals requiring team approval

**The following IDs and allocations are proposed, not approved.** They make the team's suggested feature set reviewable in the inventory, traceability, and this plan while preserving F-01-F-03. Approval still requires new SRS definitions, design reconciliation, and contracts. Team decisions must meet the teacher brief; an alternative or reduced vertical slice needs instructor/TA agreement.

| Proposed feature | Sprint | Dependencies | Decisions before approval |
|---|---|---|---|
| F-04 - Decision reasons and history | 2 | F-01, F-02, F-03 | Required reasons for each action, recorded events/order, history visibility and preservation. Preserve the minimum F-03 decision/history obligation in Sprint 1. |
| F-05 - Return and resubmit a request | 2 | F-01, F-02, F-03, F-04 | Return/resubmission states, editable fields, authorized actors, history preservation, and an explicit reconciliation with BR-04. |
| F-06 - Request filtering | 3 | F-01, F-02, F-03; F-05 for any new workflow states | Filter fields/combinations, validation/no-match behavior, and role/record access. |
| F-07 - Decision reporting | 3 | F-01, F-03, F-04, F-05 | Report audience, measures, date boundaries, and how returned/resubmitted requests contribute to totals. |

The teacher brief calls for reasons, history, and reporting in the finished product and lists return/resubmission, additional stages, filtering, and decision summaries as later-sprint examples. Proposed IDs now exist, but exact FR/BR definitions and approval remain missing. Additional approval stages are outside this proposal; confirm whether the chosen context requires them. Reconcile every teacher expectation and document any instructor-approved variation before finalizing the baseline. Self-registration, password recovery, and account administration remain outside this proposal.

## 7. Unresolved requirements and traceability gaps

These are unresolved findings, not changes to approved scope or evidence of completion.

| Gap | Evidence and impact | Required resolution / checkpoint |
|---|---|---|
| Whole-product baseline and later-sprint approval | Part A defines FR-01-FR-06, BR-01-BR-06, and NFR-01-NFR-03 for Sprint 1. Part B proposes F-04-F-07 and Sprint 2/3 dependencies, but later FR/BR definitions, team approval, owners, and estimates remain missing. | Approve or revise the proposal and reconcile Parts A/C and contracts before later implementation. Until then, Part D's collective approved baseline-coverage requirement remains unresolved; this is a review draft. |
| F-03 local completion versus acceptance | Contract, implementation, tests, and builds now exist and passed local checks. | Teammate review, versioned contract/code history, staging integration, and accepted release are still required. Do not equate local verification with submission acceptance. |
| Reviewer assignment | User approved server assignment to the designated seeded Reviewer; distinct `assignedReviewerId` and BR-05 are implemented and tested. Existing unassigned records remain inaccessible. | No assignment decision remains blocked. Any desired legacy backfill needs separate approval and evidence; no automatic backfill was performed. |
| Self-approval | BR-06, F-03 AC-11, API and unit tests explicitly reject self-owned requests despite role changes. | Preserve the check across later workflow changes; do not rely solely on today's single-role seed accounts. |
| Decision/history and reasons | F-03 now defines and verifies the minimum single decision entry (status, identity, timestamp) and owner retrieval. | Extended history/reasons remain proposed F-04 scope. Do not silently add event-log schema or return/resubmission rules. |
| Editing/cancellation, resubmission, stages, and reporting | SRS leaves Pending edits/cancellation and full scope open. Proposed F-05/F-07 lack approved rules; additional stages are outside the proposal. Resubmission needs an explicit review-cycle rule consistent with any approved revision of BR-04. | Resolve context, rules, and required scope; record approved FR/BR changes and instructor/TA agreement for deviations. The current status enum and existing BR-04 remain unchanged by this draft. |
| Cross-cutting NFR-02 verification | Shared roles/ownership/assignment/self-owner responsibilities now have executed API/PostgreSQL/unit evidence. | Retain NFR-02 and extend its verified allocation to later features after approval. |
| AC/test traceability and execution | All three contracts now map AC to planned/actual checks, with local results/version/logs. F-01 rerun and cross-Requester privacy checks passed. | Preserve feature-local IDs and the distinction between mocked UI evidence and real integration; record a reviewed immutable version after Git approval. |
| F-02 contract/design alignment | API/STS/dependency/history records and UI success feedback are now reconciled. UI title maximum remains 120; API validates only non-empty strings. | Confirm whether the limit is a product rule before changing API policy or adding a requirement. This is a disclosed boundary difference, not a missing teacher-imposed limit. |
| Persistence and reproducibility evidence | README setup commands, real PostgreSQL tests, both builds, and built HTTP owner retrieval after app restart are now recorded. | Developer database remains unchanged; cloud restart/redeployment, independent UAT, and deployment evidence belong to later lab/final checkpoints. |
| Source version and acceptance/recovery status | Local group specification is labeled a draft; its referenced DOCX was not found. Sprint 1's published deadline precedes this draft. This review did not establish accepted releases, submissions, reviews, or current execution results. | Confirm the applicable teacher revision and actual sprint/release status; assign owners and recovery dates. Preserve historical dates, contract history, and disclosed incomplete work. |

## 8. Human review boundary

Review the supported Sprint 1 allocation, proposed F-04-F-07 split, and remaining scheduling/approval decisions. The 12 November Part E task explicitly authorized local implementation, tests, contracts, and consistency updates; all changed files and actual verification are listed in [the report](sprint-1/verification.md). No Git submission or remote changes were performed. Part D remains a draft because later-sprint scope and its FR/BR/design are still proposals.
