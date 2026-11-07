# F-02 — Submit a request and view its status

## Linked requirements

FR-02, FR-03, BR-01, BR-02, NFR-03

## Feature design

An authenticated Requester enters a title and description and submits the form. The backend saves the request with status `Pending` and connects it to the signed-in Requester. The Requester can see their own saved requests and statuses.

The backend must get the Requester's identity from the authenticated session or token. It must not trust a user ID chosen in the website.

## UI behavior

- Show a form with a title and description.
- Show a success message when the request is saved.
- Show a clear message if required information is missing.
- Show the signed-in Requester's own requests and their statuses.

## Proposed API

- `POST /api/requests` — create a request for the signed-in Requester.
- `GET /api/requests/mine` — retrieve the signed-in Requester's requests.

Confirm these paths with the teammate designing the backend before implementation.

## Data

A request needs an ID, title, description, status, Requester ID, and submission time. A newly submitted request has status `Pending`.

## Acceptance criteria

- **AC-01:** A signed-in Requester submits a valid title and description; the system saves a request with status `Pending`.
- **AC-02:** The saved request belongs to the signed-in Requester.
- **AC-03:** The Requester can retrieve their saved request and status.
- **AC-04:** A Requester cannot retrieve another Requester's private request.
- **AC-05:** A request missing a required field is rejected and is not saved.

## Software Test Specification

- **TEST-01 / AC-01:** Submit valid details as a Requester. Expect a saved request with status `Pending`.
- **TEST-02 / AC-02:** Submit while signed in as Requester A. Expect the saved record to be linked to Requester A.
- **TEST-03 / AC-03:** Retrieve the Requester's requests after submission. Expect the saved request and status to appear.
- **TEST-04 / AC-04:** Request another Requester's private record. Expect refusal and no private data.
- **TEST-05 / AC-05:** Submit without a required field. Expect a validation error and no saved record.

## Definition of Done

The feature meets its acceptance criteria; planned tests pass; a teammate reviews its pull request; the feature is integrated; and setup or behavior changes are documented.