# F-02 — Submit a request and view its status

**Implementation status (28 November 2026):** F-02 includes the Requester submission and history-recovery behavior. CHG-001 was implemented and merged into `sprint-staging` through PR #52 (merge commit `5328f22`). The implementation preserves successful submission feedback when history retrieval fails, displays a separate warning, and allows the Requester to retry history retrieval without resubmitting. Verification results for CHG-001 are recorded in [the Sprint 1 report](verification.md).

## Linked requirements

FR-02, FR-03, BR-01, BR-02, NFR-01, NFR-02, NFR-03. BR-05 is the F-03 assignment rule applied when F-02 submits a request; existing IDs are retained.

## Dependencies

- F-01 verified cookie identity and `REQUESTER` role middleware.
- PostgreSQL, generated Prisma client, migrations, and synthetic seeded accounts.
- F-03's additive `assignedReviewerId` migration and designated Reviewer configuration for new submissions. This is an assignment integration prerequisite, not a circular dependency on decision handling: F-02 still precedes the F-03 review journey.
- No changes to authentication or the three-status workflow are needed for F-02. Do not trust client identity, role, assignment, status, or decision metadata.

## Feature design

An authenticated Requester enters a title and description and submits the form. The backend saves the request with status `Pending` and connects it to the signed-in Requester. The Requester can see their own saved requests and statuses.

The backend must get the Requester's identity from the authenticated session or token. It must not trust a user ID chosen in the website.

## UI behavior

- Show a form with a title and description.
- Show a success message when the request is saved.
- Show a clear message if required information is missing.
- Show the signed-in Requester's own requests and their statuses.
- Show loading/current-user checks, an empty history, API/connection failures, and a success message after saving. Clear title/description on successful save and reload history.
- When the retrieved record has a decision, show its status, Reviewer ID, and decision time. The history here is a list of the owner's requests with their single Sprint 1 decision metadata, not an event log.
- HTML requires both fields and currently limits the title to 120 characters. The API validates non-empty strings but does not impose that maximum. The UI limit is a disclosed implementation difference, not an approved new product rule. Resolve a shared length policy with the teammate before promoting it to an FR/BR.
- A successful request submission must remain acknowledged as successful even if the subsequent history retrieval fails.
- A history-refresh failure must be displayed separately from the submission success message.
- Provide a manual action for the Requester to retry history retrieval without submitting the request again.
- Show loading feedback while the history retry is in progress and prevent duplicate retry actions.
- When a retry succeeds, update the displayed request history and clear the history-refresh warning.
- When a retry fails, preserve the previously displayed history and keep the warning visible.
- Retrying history must not create another request or change the result of the original submission.
- Existing submission validation and POST-failure behavior remain unchanged.

## API specification

Protected operations require the HTTP-only `accessToken` cookie and the `REQUESTER` role. Both use JSON; safe errors are `{ "error": "message" }`. Missing/invalid sessions return `401`; a Reviewer receives `403`. Malformed JSON returns `400` without internal exception details.

### `POST /api/requests`

Body: `{ "title": "Travel request", "description": "Attend a workshop" }`. Both values must be strings and non-empty after trimming. Stored values are trimmed. The server derives `requesterId` from the session, looks up the designated Reviewer, and initializes `PENDING`; submitted ownership, assignment, status, and decision fields are not authoritative.

Success: `201` with the persisted Request object. `400` rejects missing/incorrectly typed/whitespace-only required values and saves nothing. `503` saves nothing if the designated account is missing or is not a Reviewer. Unexpected database failures return a generic `500`.

### `GET /api/requests/mine`

No body. Success: `200` with an array filtered by the authenticated `requesterId`, ordered by `createdAt` descending. An owner with no records receives `[]`. No request-by-ID operation is introduced; a cross-Requester privacy check must prove the other owner's record is absent from this list. Unexpected database failures return a generic `500`.

### Request response shape

Each object contains integer `id`, string `title`/`description`, `status` (`PENDING`, `APPROVED`, or `REJECTED`), integer `requesterId`, nullable integer `assignedReviewerId`, nullable integer `reviewerId`, ISO `createdAt`, and nullable ISO `decidedAt`. Creation returns null decision metadata. Later retrieval returns saved F-03 decision metadata. No password hashes or tokens are included.

## Data

A request needs an ID, title, description, status, Requester ID, and submission time. A newly submitted request has status `Pending`.

Prisma `Request` uses a generated primary key, a required owner relation (`onDelete: Restrict`), default `PENDING`, and default submission timestamp. F-03 adds the nullable assigned-Reviewer foreign key/index in `20261112000000_reviewer_assignment`; decision identity/time already existed. The API sets the new assignment for new records. Existing records are not backfilled or deleted. No separate F-02 migration or authentication schema change is required.

## Acceptance criteria

- **AC-01:** A signed-in Requester submits a valid title and description; the system saves a request with status `Pending`.
- **AC-02:** The saved request belongs to the signed-in Requester.
- **AC-03:** The Requester can retrieve their saved request and status.
- **AC-04:** A Requester cannot retrieve another Requester's private request.
- **AC-05:** A request missing a required field is rejected and is not saved.
- **AC-06:** A successful request submission remains acknowledged as successful even when the subsequent history retrieval fails.
- **AC-07:** A failed history retrieval displays a separate warning without changing the successful submission outcome.
- **AC-08:** The Requester can retry history retrieval without submitting the request again.
- **AC-09:** The retry action displays loading feedback while history is being retrieved.
- **AC-10:** A successful retry updates the displayed history and clears the warning.
- **AC-11:** A failed retry preserves previously displayed history and keeps the warning visible.

## Software Test Specification

- **TEST-01 / AC-01:** Submit valid details as a Requester. Expect a saved request with status `Pending`.
- **TEST-02 / AC-02:** Submit while signed in as Requester A. Expect the saved record to be linked to Requester A.
- **TEST-03 / AC-03:** Retrieve the Requester's requests after submission. Expect the saved request and status to appear.
- **TEST-04 / AC-04:** Request another Requester's private record. Expect refusal and no private data.
- **TEST-05 / AC-05:** Submit without a required field. Expect a validation error and no saved record.

The IDs above are feature-local planned IDs. They do not rename the existing backend tests, whose actual names differ. Detailed mapping follows:

| Planned F-02 ID / AC | Level | Preconditions, input, and action | Expected result | Actual verification |
|---|---|---|---|---|
| TEST-01 / AC-01 | API/database integration | Fresh migrated isolated database and seeded Requester/Reviewer. Sign in; POST non-empty title/description. | `201`, saved `PENDING` record. | `server/test/requests.test.ts`: `TEST-03: Requester saves and retrieves their own Pending request`. |
| TEST-02 / AC-02 | API/database integration | Same signed-in Requester; POST a forged `requesterId`/assignment/Reviewer identity with valid fields. | Session owner and server assignment preserved; no client-selected identity. | Existing `TEST-03`, plus `server/test/reviewer.test.ts`: `TEST-F03-10-SUBMIT: server assigns the designated Reviewer and ignores spoofed identities`. |
| TEST-03 / AC-03 | API/database integration and UI | Create a request; retrieve `/mine`. Later decide it through F-03 and retrieve again as owner. | Saved request/status and decision metadata appear. | Existing `TEST-03`; `TEST-F03-02/03/04: persists APPROVED/REJECTED with session identity and owner retrieval`; UI `TEST-F03-UI-OWNER` in `RequesterEvidence.test.tsx`. |
| TEST-04 / AC-04 | API/database integration | Owner A has a decided request; sign in as distinct Requester B and GET `/mine`. | Owner A's record/decision is absent; no private data returned. | `server/test/reviewer.test.ts`: `TEST-F02-OWNERSHIP: another Requester cannot see the owner's request or saved decision`. |
| TEST-05 / AC-05 | API/database integration | POST empty title, absent description, whitespace-only description, and non-string title. Count rows before/after in the isolated database. | `400` and no added row. | Existing `TEST-03` plus four `TEST-F02-VALIDATION` cases in `server/test/reviewer.test.ts`. |
| Shared NFR-01/NFR-02 | API/database integration | Submit signed out; sign in as Reviewer and call Requester operations. | `401`/`403`, no private data. | Existing `TEST-01`, `TEST-04`; F-03 access tests supplement shared middleware coverage. |
| UI success / AC-01, AC-03 | Component/UI with mocked API | Submit through the form, receive success, reload the Requester's list. | Success feedback, form cleared, `PENDING` record displayed. | Existing `TEST-UI-01` in `client/src/App.test.tsx`; `TEST-F02-UI-SUCCESS` in `RequesterEvidence.test.tsx`. Mocked UI checks do not establish database persistence. |

## Requester History Recovery — CHG-001

| Test ID / AC | Level | Preconditions, input, and action | Expected result | Actual verification |
|---|---|---|---|---|
| TEST-06 / AC-06, AC-07 | Component/UI | Sign in as a Requester. Submit a valid request. Mock POST as successful and the subsequent history GET as failed. | Submission success remains visible and a separate history-refresh warning appears. | `client/src/App.test.tsx`: TEST-06 |
| TEST-07 / AC-08, AC-10 | Component/UI | Cause the history refresh after submission to fail, then retry with a successful GET. | History updates, warning disappears, and no second POST occurs. | `client/src/App.test.tsx`: TEST-07 |
| TEST-08 / AC-11 | Component/UI | Display existing history, then make the submission refresh and subsequent retry fail. | Previously displayed history remains and the warning stays visible. No duplicate submission occurs. | `client/src/App.test.tsx`: TEST-08 |
| TEST-09 / AC-09 | Component/UI | Trigger history retry while the GET request remains pending. | Loading feedback appears and duplicate retry actions are prevented. | `client/src/App.test.tsx`: TEST-09 |

The separately proposed TEST-10 is not implemented as an independent test. Its no-resubmission behavior is covered by TEST-07 and TEST-08, which verify that only one POST occurs while history retrieval is retried.

CHG-001 implementation and verification are complete. TEST-06 through TEST-09 are implemented in `client/src/App.test.tsx`. All 27 client tests passed, and the production build succeeded. Browser verification also confirmed that a successful submission remains acknowledged after history retrieval fails, and that retry updates history without a second POST. Detailed verification evidence is recorded in [verification.md](verification.md).

## Execution record

See [verification.md](verification.md) for actual commands, counts, runtime, tested working-tree identity, TDD evidence, and limitations. The backend suite runs against a fresh loopback-only PostgreSQL cluster created by `server/scripts/test-local.mjs`; it never takes its connection from the developer's `.env`. The original fixture cleanup runs only in that isolated cluster. No passing result is inferred from implementation or this contract.

## Definition of Done

The feature meets its acceptance criteria; planned tests pass; a teammate reviews its pull request; the feature is integrated; and setup or behavior changes are documented.

Apply the shared [Product Definition of Done](product-dod.md). For CHG-001, teammate review and integration into `sprint-staging` are recorded in PR #52. Final release verification on `main` remains a separate step.

## Version history

| Revision | Actual status and rationale |
|---|---|
| Original draft | Existing feature/AC-01-AC-05 and TEST-01-TEST-05 retained. Its API was labeled proposed even though implementation existed. No pre-implementation approval or execution date is inferred. |
| 12 November 2026 local revision | Expanded existing API/data/STS/dependency documentation; recorded actual test mapping and F-03 assignment integration. Preserved teammate implementation and IDs; added missing success feedback and decision metadata display. |
| 27 November 2026 — Lab 7 contract revision | Added AC-06–AC-11 and proposed TEST-06–TEST-10 to specify successful submission acknowledgement, separate history-refresh warning, retry behavior, loading feedback, and preservation of displayed history. |
| Contract review | The CHG-001 contract revision was reviewed before implementation. |
| 27–28 November 2026 — CHG-001 implementation | Implemented requester history recovery in the client, added TEST-06–TEST-09, and updated the System SDS. PR #52 was approved and merged into `sprint-staging` on 28 November 2026 (merge commit `5328f22`). Verification results are recorded in `verification.md`. |