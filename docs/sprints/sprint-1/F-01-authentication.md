# F-01 — Authentication and Current-User Identity

## Feature summary

F-01 lets a Requester or Reviewer sign in, identify the signed-in user, and sign out. The backend verifies identity from the authentication cookie. The client cannot choose a user ID or role to gain access.

**Implementation status:** Authentication is implemented. This contract was documented after implementation.

## Linked requirements

- **FR-01:** A user can sign in and out, and the system identifies the signed-in user.
- **NFR-01:** Protected features reject unauthenticated access without returning private information.
- **NFR-02:** The backend enforces role and ownership restrictions.

## Dependencies

- Seeded user accounts with Requester and Reviewer roles.
- PostgreSQL and the Prisma database connection.
- User records with unique email addresses and stored password hashes.

## Behavior

1. The user enters an email and password in the sign-in form.
2. The API checks the credentials against the stored user and password hash.
3. On successful sign-in, the API returns the user’s ID, email, and role and sets an HTTP-only authentication cookie.
4. The client obtains the current user from the API. The client does not choose the user ID or role.
5. The user can sign out. The API clears the authentication cookie.
6. Protected API requests without a valid session are rejected.

## UI specification

- The sign-in screen provides email and password fields and a sign-in button.
- The password can be shown or hidden.
- Failed sign-in displays a user-safe error message.
- When signed in, the application displays the user’s email and role.
- The application checks the current user when it loads and displays a loading state during the check.
- The sign-out control ends the session and returns the user to the signed-out screen.
- Connection and API errors do not expose internal server details, passwords, or tokens.

## API specification

The API uses JSON request and response bodies. Authentication is carried by the HTTP-only `accessToken` cookie.

### `POST /api/auth/login`

Accepts an email and password:

```json
{
  "email": "requester@example.test",
  "password": "<seeded test password>"
}
```

On success, returns HTTP `200` with the user’s ID, email, and role, and sets the authentication cookie.

Invalid credentials return HTTP `401` with a user-safe error. Missing or incorrectly typed credentials return HTTP `400`. The response does not expose the password hash or token.

### `GET /api/auth/me`

Requires a valid authentication cookie.

On success, returns HTTP `200` with the signed-in user’s ID, email, and role. A missing, invalid, or expired session returns HTTP `401`.

### `POST /api/auth/logout`

Clears the authentication cookie and returns HTTP `204`. After logout, `GET /api/auth/me` returns HTTP `401`.

### Protected endpoints

The API enforces authentication and role restrictions on the server. An unauthenticated request to a protected endpoint returns HTTP `401`. A signed-in user without the required role receives HTTP `403`.

## Data and security specification

- `User.email` is unique.
- `User.passwordHash` stores a bcrypt hash, not the original password.
- `User.role` is `REQUESTER` or `REVIEWER`.
- The API determines the current user from the verified session. It does not trust a user ID or role sent by the client.
- A successful login creates a JWT with a one-hour expiry and sends it in an HTTP-only cookie named `accessToken`.
- The cookie uses `SameSite=Lax` and the `/` path. It is marked `Secure` in production.
- `JWT_SECRET` and `DATABASE_URL` are private configuration values. Do not include their real values in this document, Git, or the submitted PDF.
- Tests use synthetic seeded accounts. Do not use personal account credentials or real passwords in the contract.

## Acceptance criteria

- **AC-01 — Successful sign-in:** Given a seeded user with valid credentials, when they sign in, the API returns HTTP `200`, returns that user’s ID, email, and role, and sets a usable authentication cookie.
- **AC-02 — Invalid credentials:** Given an invalid email or password, when the user attempts to sign in, the API returns HTTP `401` and does not establish an authenticated session.
- **AC-03 — Current-user identity:** Given a valid session, when the client requests `GET /api/auth/me`, the API returns HTTP `200` with the ID, email, and role belonging to that session.
- **AC-04 — Sign-out:** Given a signed-in user, when they sign out, the API clears the authentication cookie; a later request to `GET /api/auth/me` returns HTTP `401`.
- **AC-05 — Signed-out access:** Given no valid session, when a user calls a protected endpoint, the API returns HTTP `401` without returning private data.
- **AC-06 — Role restriction:** Given a signed-in Reviewer, when they call an endpoint restricted to Requesters, the API returns HTTP `403`. The backend enforces this restriction.

## Software Test Specification and current evidence

| Test ID and actual test name | Linked AC | Level and file | Preconditions, input, and action | Expected result | Status |
|---|---|---|---|---|---|
| `TEST-01: rejects a signed-out request submission` | AC-05 | API test — `server/test/requests.test.ts` | Without a session, submit a request to `POST /api/requests`. | HTTP `401`; the request is not accepted. | Implemented |
| `TEST-02: rejects an incorrect password` | AC-02 | API test — `server/test/requests.test.ts` | Submit the seeded Requester email with an incorrect password. | HTTP `401`. | Implemented; the test does not check session state afterward. |
| `TEST-03: Requester saves and retrieves their own Pending request` | AC-01, AC-04 | API/database integration test — `server/test/requests.test.ts` | Sign in, submit and retrieve a request, sign out, then call `/api/auth/me`. | The request is saved for the signed-in user; after sign-out, `/api/auth/me` returns HTTP `401`. | Implemented |
| `TEST-04: refuses to let a Reviewer use the Requester-only list` | AC-06 | API test — `server/test/requests.test.ts` | Sign in as the seeded Reviewer and call `GET /api/requests/mine`. | HTTP `403`. | Implemented |
| `TEST-AUTH-ME-01: returns the signed-in user's current identity` | AC-01, AC-03 | API test — `server/test/requests.test.ts` | Sign in as the seeded Requester, check the login response, then call `GET /api/auth/me`. | Login and `/api/auth/me` return the Requester’s ID, email, and role. The session agent retains the cookie. | Executed successfully on 12 November 2026; see verification report. |
| `TEST-AUTH-INVALID-01: invalid login does not create a session` | AC-02 | API test — `server/test/requests.test.ts` | Attempt login with the seeded Requester email and an incorrect password, then call `/api/auth/me` using the same session agent. | Login returns HTTP `401`; `/api/auth/me` also returns HTTP `401`. | Implemented |
| `TEST-UI-01: signs in, submits a request, and shows its Pending status` | AC-01 | UI test — `client/src/App.test.tsx` | Sign in and submit a request through the UI. The test simulates API responses. | The request and `PENDING` status appear in the UI. | Implemented; UI evidence only, not a real API/database integration test. |

### Test execution record

Historical record: six tests were previously reported passing before the latest identity assertion. On 12 November 2026, all six existing tests, including that assertion, passed in the initial 45-test backend suite. After the final review corrections, they passed again in the complete **55-test** backend suite on isolated PostgreSQL. The original Requester UI journey also passed again in the **19-test** frontend suite. F-01 implementation and existing tests were not rewritten.

```text
Command: npm test
Directory: server
Current runner: creates an isolated PostgreSQL test cluster; no developer database is used.
Final result after review corrections: 55 passed, 0 failed, 0 skipped; includes all 6 original tests.
Final runtime: Node 24.15.0; 12 November 2026.
```

Do not mark a test result as passing until it has been rerun after the latest code change.

See [verification.md](verification.md) for the exact executed Node/runner commands, test names, working-tree snapshot, logs, builds, and remaining review/release gates. F-01 introduces no standalone domain BR; its authentication/role middleware supports the business rules in F-02/F-03. Additional invalid/expired/unknown-user session checks for the new Reviewer paths are in `server/test/reviewer.test.ts` (`TEST-F03-SESSION`).

## Definition of Done

- The implementation matches the acceptance criteria.
- Authentication, current-user identity, logout, signed-out access, and role restrictions have meaningful tests.
- The latest server test results are recorded accurately.
- Test IDs and names in this document match the test files.
- The README explains safe local setup and the seed procedure without exposing real secrets.
- The contract and related implementation changes are reviewed by the teammate and merged through the team’s branch workflow.
- Any incomplete checks or failures are disclosed.
- Apply the shared [Product Definition of Done](product-dod.md).

## History

The authentication implementation and tests existed before this contract was written. This contract documents the behavior retrospectively; it does not claim to have been written or approved before implementation.

12 November 2026 local addendum: reviewed existing F-01 without changing its implementation, AC IDs, or existing tests; updated only the stale execution record and shared DoD/verification references. Teammate review and versioned integration remain pending.
