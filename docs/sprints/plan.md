# Part D - Three-Sprint Plan

**Status:** Draft for human review, prepared 11 November 2026. F-01, F-02, and F-03 retain their existing Sprint 1 allocation. F-04-F-07 now identify the team's suggested later-sprint scope in the inventory and traceability, with the allocation below proposed for approval. No later-sprint scope approval is recorded. This draft does not establish that any sprint has been accepted or released.

## 1. Sources and planning basis

Repository sources reviewed:

- [SRS](../srs.md): FR-01 through FR-06, BR-01 through BR-04, NFR-01 through NFR-03, exclusions, and open scope questions.
- [Feature inventory](../features.md) and [traceability](../traceability.md): confirmed F-01, F-02, and F-03 remain allocated to Sprint 1; proposed F-04-F-07 and their later-sprint allocation are explicitly pending team approval and new SRS definitions.
- [System-Level SDS](../system-sds.md): React/TypeScript/Vite client, Express/TypeScript API, PostgreSQL/Prisma persistence, cookie authentication, permissions, and planned F-03 behavior.
- Existing Sprint 1 contracts: [F-01](sprint-1/F-01-authentication.md) and [F-02](sprint-1/F-02-requester.md). No F-03 contract was found.
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
| Sprint 1 | Deliver a small working approval journey with real authentication, server permissions, and database persistence. | **F-01, F-02, F-03** | PostgreSQL, Prisma migrations and synthetic seeded accounts; F-02 depends on F-01; F-03 depends on F-01 and F-02. F-03 also needs its missing contract and the Theme 5 access decisions below. | Deliverable 1, **8 November 2026**: Requester submission through Reviewer decision and Requester retrieval of the saved result; meaningful rule/access tests; reviewed integration and an identifiable local release on main. This is the target, not the current achieved state. |
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
| **F-01 - Sign in, sign out, and identify the current user** | FR-01, NFR-01, NFR-02. | Foundation for F-02 and F-03. Use seeded Requester/Reviewer accounts, hashed passwords, verified cookie identity, and backend role middleware. No preceding product feature; requires the user database and private configuration. | Auth API and sign-in/current-user/sign-out UI are present. Contract records implementation retrospectively and a test rerun still pending after an assertion change. Completion requires current execution evidence and review, not just implementation. |
| **F-02 - Submit a request and let the Requester view its status** | FR-02, FR-03, BR-01, BR-02, NFR-02, NFR-03. Inventory/traceability now include its shared ownership responsibility under NFR-02. | Depends on F-01. Accept title and description, derive ownership from the session, save `Pending`, and retrieve only the Requester's own records. | Requester UI, create/list API, and Prisma persistence are present. API/database tests exercise submission/retrieval and session-derived ownership; the UI test mocks API responses. Cross-Requester isolation and the contract/design inconsistencies below remain to be verified/resolved. |
| **F-03 - Let a Reviewer view and decide pending requests** | FR-04, FR-05, FR-06, BR-03, BR-04, NFR-02, NFR-03. | Depends on F-01 and F-02. Reviewer reads authorized pending requests and approves or rejects once. Save status, Reviewer identity, and decision time together. Requester retrieves the saved status through F-02. | Defined in the inventory/SDS, but no feature contract, Reviewer API, decision tests, or working Reviewer UI was found. The UI is a placeholder. This is required Sprint 1 work still outstanding, not an implemented capability. Exact endpoints/errors and teacher access/history expectations require resolution before implementation. |

### How the complete Sprint 1 journey must work

1. A seeded Requester signs in through the React UI. `POST /api/auth/login` checks the stored bcrypt hash and sets the HTTP-only `accessToken` cookie; `GET /api/auth/me` identifies the authenticated user. The existing lifecycle uses a one-hour JWT, `SameSite=Lax`, and `Secure` in production; logout clears the cookie. Missing/invalid sessions are refused by the API.
2. The Requester submits a title and description through `POST /api/requests`. The Express API validates the fields, enforces `REQUESTER`, and uses the authenticated identity for `requesterId`. Prisma writes the request to PostgreSQL with `PENDING`, satisfying BR-01. `GET /api/requests/mine` retrieves only the owner's requests, satisfying BR-02.
3. After sign-out, a seeded Reviewer signs in. F-03 must replace the placeholder with a pending-request review UI and protected review API. The API must enforce `REVIEWER` (BR-03), the agreed assignment/authorization policy, and the chosen self-approval prevention rule. These last two policies are teacher expectations whose exact repository definitions are missing; this plan does not choose them implicitly.
4. The Reviewer approves or rejects a `PENDING` request. F-03 must persist `APPROVED` or `REJECTED`, `reviewerId`, and `decidedAt` together, and reject a later invalid/repeated decision under BR-04. The contract must define the decision/history representation required by Theme 5; the existing fields must not be described as an approved full history design.
5. The Requester signs in again and retrieves the same saved request through the UI/API. Its persisted decision is visible. Demonstrate approval and rejection on separate requests, as well as an invalid transition and forbidden access. Verify database-backed retrieval; a mocked UI response alone does not prove persistence.

This journey connects **UI -> API -> PostgreSQL** and changes domain state. Authentication and submission ending at `PENDING` are only part of the required workflow. Sprint 1 is incomplete until Reviewer decision and subsequent persisted retrieval work and are verified.

### Sprint 1 completion evidence

- Meet the existing F-01/F-02 acceptance criteria and the F-03 criteria once specified; keep each feature's AC and test IDs in its own contract context rather than renumbering existing IDs.
- Execute meaningful automated checks for valid/invalid sign-in, current-user identity/logout, signed-out access, wrong-role access, cross-Requester privacy, new `PENDING` status, approval/rejection, repeated/invalid decisions, and saved-result retrieval. Add the Theme 5 self-approval and unrelated-Reviewer checks after resolving their policies. A rejected operation must not mutate protected data.
- Retain API/database integration evidence, selected UI/end-to-end journeys, and build/test commands, passing/failing/skipped counts, actual test names/files, and tested commit. No application tests were run for this documentation-only draft; no passing result is asserted here.
- Follow the course Issue -> feature/fix branch -> teammate-reviewed sprint staging PR -> integration/acceptance checks -> reviewed main release process. Record the actual accepted tag/commit and both students' contributions. This is a future acceptance gate; preparing this draft performs none of those Git or external actions.
- Provide reproducible local dependencies, environment-variable names, migrations, seed, run/build/test instructions, and safe test access. Preserve the existing exclusions of self-registration, password recovery, and advanced account administration for this checkpoint. Keep real secrets out of submitted evidence.

## 4. Sprint 2 conditional scope and completion

**Goal:** deliver decision reasons/history and return/resubmission if approved, preserving Sprint 1 behavior. **Proposed feature IDs:** F-04 and F-05; no later-sprint approval is recorded. F-04 supplies the richer history used by F-05. Minimum Sprint 1 decision/history behavior remains in F-03.

Before implementation, the team must approve the allocation, reconcile Theme 5's expectations with new SRS definitions, and prepare each feature's design, AC, STS, and DoD. Parts B/D now record proposed scope only; Parts A/C and existing contracts remain unchanged. The proposed F-05 review cycle must be reconciled explicitly with BR-04 before a previously decided request can re-enter review.

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
| Whole-product baseline and later-sprint approval | Part A still defines FR-01-FR-06, BR-01-BR-04, and NFR-01-NFR-03. Part B now proposes F-04-F-07 and Sprint 2/3 dependencies, but new FR/BR definitions, team approval, owners, and estimates remain missing. | Approve or revise the proposal and reconcile Parts A/C and contracts before implementation. Until then, Part D's collective approved baseline-coverage requirement remains unresolved; this is a review draft. |
| Missing F-03 contract and implementation | No F-03 contract was found; Reviewer UI is a placeholder and review/decision routes/tests are absent. FR-04-FR-06 and BR-03/BR-04 are allocated but not delivered. | Specify UI/API/data, AC, STS, errors, permissions, and DoD before implementation; finish and verify as outstanding Sprint 1 work. Do not invent endpoint paths here. |
| Reviewer assignment and authorized record scope | Theme 5 requires assigned/authorized requests and a test for unrelated Reviewer access. Current design requires a Reviewer role but does not define a per-request authorization policy. `reviewerId` records a decision's Reviewer; it is not an established assignment model. | Team/instructor must resolve the policy and trace it to requirements, design, F-03 AC, and API tests before claiming Theme 5 Sprint 1 compliance. Do not assume every Reviewer may decide every request. |
| Self-approval rule | Teacher requires a chosen prevention rule and self-approval test; no explicit BR/AC/test exists. Single-role accounts alone are not documented as the accepted policy or verified as sufficient. | Define the rule, identity/role implications, failure behavior, and test. Resolve within the Sprint 1 compliance review; retain existing BR IDs. |
| Decision/history and reasons | SDS plans status, Reviewer identity, and time; Theme 5 asks for a recorded decision/history entry and broader history/reasons. The current schema stores one optional decision's metadata, not a defined event history or reason field. | Agree what satisfies the Sprint 1 decision/history entry and how later history/reasons work. Trace the decision to F-03 and later approved scope; do not silently assert a new audit-log design. |
| Editing/cancellation, resubmission, stages, and reporting | SRS leaves Pending edits/cancellation and full scope open. Proposed F-05/F-07 lack approved rules; additional stages are outside the proposal. Resubmission needs an explicit review-cycle rule consistent with any approved revision of BR-04. | Resolve context, rules, and required scope; record approved FR/BR changes and instructor/TA agreement for deviations. The current status enum and existing BR-04 remain unchanged by this draft. |
| Cross-cutting NFR-02 verification | Inventory/traceability now identify F-01/F-02/F-03 shared responsibilities consistently. Actual ownership and Reviewer verification gaps remain. | Retain NFR-02; verify F-02 ownership and F-03 role/record restrictions with actual tests. Extend the approved verification allocation to later features after approval. |
| AC/test traceability and execution | Existing traceability describes intended checks but lacks full AC -> planned test -> actual file/name -> result/version mapping. F-01 records a pending rerun; F-02 planned TEST-01-TEST-05 labels are not a one-to-one match to actual server test names. No cross-Requester privacy test or F-03 tests were found. The UI test uses mocked fetch responses. | Keep feature-local AC/test IDs; map actual evidence accurately, add missing checks through later authorized implementation work, and record actual executions. Do not report planned or mocked persistence checks as passed integration evidence. |
| F-02 contract/design alignment | Contract still calls the implemented API paths proposed and asks for confirmation. It calls for a success message; current UI clears/reloads without an explicit success message. UI limits titles to 120 characters, while the API checks only non-empty strings. | Reconcile contract versus implementation, confirm whether the length limit is a product rule, and update implementation/tests or approved contract in a separate task. Do not invent a new requirement here. |
| Persistence and reproducibility evidence | Current backend tests retrieve a created request; they do not demonstrate decision persistence or survival after application restart/redeployment. Root README is only a project title; client README is a template. | Complete the Sprint 1 setup/evidence handoff; verify durable storage for Lab 5 and final delivery. Record commands/results and versions rather than claiming reproducibility from schema presence alone. |
| Source version and acceptance/recovery status | Local group specification is labeled a draft; its referenced DOCX was not found. Sprint 1's published deadline precedes this draft. This review did not establish accepted releases, submissions, reviews, or current execution results. | Confirm the applicable teacher revision and actual sprint/release status; assign owners and recovery dates. Preserve historical dates, contract history, and disclosed incomplete work. |

## 8. Human review boundary

Review the supported Sprint 1 allocation, proposed F-04-F-07 scope/sprint split, outstanding teacher requirements, and missing ownership/scheduling decisions. Following the request to update inventory and traceability, this revision changes only `docs/features.md`, `docs/traceability.md`, and `docs/sprints/plan.md`. Parts A/C, contracts, application code, and tests remain unchanged. This draft records no team approval, application verification, commits, pushes, merges, or pull requests. Part D remains a draft for human review.
