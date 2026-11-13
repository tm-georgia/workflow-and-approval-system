# Part F — Selected execution evidence

**Recorded:** 13 November 2026 (Asia/Bangkok).

**Tested implementation:** `cfa33c0ac2ede1b5afdca7cb65aeb1915fdb8d5f` (`cfa33c0`).

[Verification report and all 22 AC mappings](../part-f-verification.md). These are retained results from actual execution on the identified implementation, not tests run while preparing this documentation. No machine-specific setup, database data directory, credentials or cookie/token values are included. Output blocks are selected actual log lines; absolute working-directory lines, owned-run paths and unrelated startup/worker telemetry are omitted. Counts, test names, response values and assertions are unchanged. Exit results come from the recorded command executions.

## Automated tests and builds

### Full backend suite and built HTTP/restart smoke

Working directory: `server`. Command: `npm.cmd test -- --smoke --reporter=verbose`. Exit **0**, **55 passed / 0 failed / 0 skipped**, 4 files, plus **2 passing smoke checks**. Vitest 5.1.0. Cluster setup/migrations/synthetic seed ran only in a fresh owned loopback cluster, which stopped after the run.

Selected actual output, including every executed backend test name:

```text
 ✓ test/requests.test.ts > authentication and Requester requests > TEST-01: rejects a signed-out request submission 27ms
 ✓ test/requests.test.ts > authentication and Requester requests > TEST-02: rejects an incorrect password 356ms
 ✓ test/requests.test.ts > authentication and Requester requests > TEST-03: Requester saves and retrieves their own Pending request 263ms
 ✓ test/requests.test.ts > authentication and Requester requests > TEST-04: refuses to let a Reviewer use the Requester-only list 242ms
 ✓ test/requests.test.ts > authentication and Requester requests > TEST-AUTH-ME-01: returns the signed-in user's current identity 231ms
 ✓ test/requests.test.ts > authentication and Requester requests > TEST-AUTH-INVALID-01: invalid login does not create a session 247ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-01: lists only assigned non-self-owned Pending records 22ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-02/03/04: persists APPROVED with session identity and owner retrieval 21ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-02/03/04: persists REJECTED with session identity and owner retrieval 16ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-05: both operations reject signed-out and wrong-role access 13ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-06: refuses to replace an existing APPROVED decision 13ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-06: refuses to replace an existing REJECTED decision 12ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-ID: rejects invalid ID 0 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-ID: rejects invalid ID -1 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-ID: rejects invalid ID 1.5 2ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-ID: rejects invalid ID 1e2 2ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-ID: rejects invalid ID 01 2ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-ID: rejects invalid ID abc 2ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-ID: rejects invalid ID 2147483648 2ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-VALUE: refuses invalid decision {"value":null} without mutation 4ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-VALUE: refuses invalid decision {"value":"PENDING"} without mutation 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-VALUE: refuses invalid decision {"value":"approved"} without mutation 4ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-VALUE: refuses invalid decision {"value":""} without mutation 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-VALUE: refuses invalid decision {"value":1} without mutation 4ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-VALUE: refuses invalid decision {"value":{}} without mutation 4ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-VALUE: refuses invalid decision {"value":["APPROVED"]} without mutation 4ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-07-MISSING: rejects missing decision and unknown record 6ms
TEST-F03-08 barrier: observed two distinct PostgreSQL UPDATE sessions waiting on the held request lock.
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-08: concurrent decisions have exactly one winner and preserve its metadata 146ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-10: unrelated Reviewers cannot list or decide another assignment 12ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-11: self-approval is refused even after a role change 6ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-10-SUBMIT: server assigns the designated Reviewer and ignores spoofed identities 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-10-UNAVAILABLE: missing designated Reviewer refuses submission without saving 7ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F02-OWNERSHIP: another Requester cannot see the owner's request or saved decision 245ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-EMPTY: a Reviewer without assigned work receives an empty list 4ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-ERROR: database failures produce safe errors and do not save decisions 8ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-JSON: malformed JSON returns a safe validation error 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-SESSION: invalid, expired, and unknown-user sessions cannot review 13ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F03-10-WRONG-ROLE: a designated account without Reviewer role cannot receive submissions 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F02-VALIDATION: invalid required fields do not save {"title":"","description":"valid"} 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F02-VALIDATION: invalid required fields do not save {"title":"valid"} 3ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F02-VALIDATION: invalid required fields do not save {"title":"valid","description":"  "} 4ms
 ✓ test/reviewer.test.ts > F-03 real API/PostgreSQL workflow > TEST-F02-VALIDATION: invalid required fields do not save {"title":12,"description":"valid"} 2ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-01: stops the owned cluster after a failed startup command 3ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-01: stops the owned cluster after a timed-out startup command 1ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-02: absent PID metadata never causes an unrelated stop 1ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-03: waits for a startup PID record to finish before stopping 1ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-04: refuses mismatched directory metadata 2ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-04: refuses mismatched port metadata 0ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-04: refuses mismatched pid metadata 0ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-05: rejects an escaped/symlinked data directory 0ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-06: refuses another run's ownership marker 0ms
 ✓ test/test-cluster-cleanup.test.mjs > Owned PostgreSQL test-cluster cleanup > TEST-CLEANUP-07: discloses incomplete PID metadata without guessing a target 1ms
 ✓ test/reviewer-rules.test.ts > F-03 boundary and authorization rules > TEST-F03-UNIT-01: assignment never permits self-approval or an unassigned record 1ms
 ✓ test/reviewer-rules.test.ts > F-03 boundary and authorization rules > TEST-F03-UNIT-02: PostgreSQL integer boundaries and canonical IDs are enforced 0ms
 ✓ test/reviewer-rules.test.ts > F-03 boundary and authorization rules > TEST-F03-UNIT-03: only final Sprint 1 decisions are permitted 0ms
 Test Files  4 passed (4)
      Tests  55 passed (55)
   Start at  04:05:03
   Duration  3.61s (tests 80%, import 17%, transform 2%, worker 1%)
PASS: built HTTP server login -> submission -> assigned list -> forbidden Requester decision -> approval -> repeated-decision refusal.
PASS: saved decision identity/time and owner retrieval survive a built application restart.
waiting for server to shut down.... done
server stopped
```

### Frontend component/UI tests

Working directory: `client`. Command: `npm.cmd test`. Exit **0**, **19 passed / 0 failed / 0 skipped**, 3 files. These React tests mock API responses.

```text
> client@0.0.0 test
> vitest run




 Test Files  3 passed (3)
      Tests  19 passed (19)
   Start at  04:00:56
   Duration  3.35s (environment 46%, tests 40%, setup 10%, import 3%, transform 1%)
```

### Backend TypeScript check

Working directory: `server`. Command: `npm.cmd run typecheck`. Exit **0**, no diagnostics.

```text
> server@1.0.0 typecheck
> tsc --noEmit
```

### Backend production build

Working directory: `server`. Command: `npm.cmd run build`. Exit **0**; includes another successful typecheck.

```text
> server@1.0.0 build
> npm run typecheck && node scripts/build.mjs


> server@1.0.0 typecheck
> tsc --noEmit

Backend production bundle written to dist/index.js.
```

### Frontend TypeScript and production build

Working directory: `client`. Command: `npm.cmd run build`. Exit **0**; includes `tsc -b`.

```text
> client@0.0.0 build
> tsc -b && vite build

vite v8.3.6 building client environment for production...
transforming...
✓ 18 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-BIpm-fyH.css    4.11 kB │ gzip:  1.61 kB
dist/assets/index-BLagO3wK.js   226.97 kB │ gzip: 70.55 kB

✓ built in 335ms
```

## Real HTTP checks

The following **30 requests/checks passed** through the real frontend proxy, built backend and verified disposable PostgreSQL cluster. They are supplementary execution checks, not 30 additional Vitest cases. Independent API sessions were used; user browser cookies were not copied. For login and post-logout rows, the role/context column identifies the intended/former role, not a claim that an unsuccessful or logged-out session is authenticated.

| # | Actual check | Role/context | Request | Expected HTTP | Actual HTTP | Result |
|---|---|---|---|---|---|---|
| 1 | Signed-out /auth/me | SIGNED_OUT | `GET /api/auth/me` | 401 | 401 | PASS |
| 2 | Signed-out /requests/mine | SIGNED_OUT | `GET /api/requests/mine` | 401 | 401 | PASS |
| 3 | Signed-out /requests/pending | SIGNED_OUT | `GET /api/requests/pending` | 401 | 401 | PASS |
| 4 | Invalid sign-in refused | REQUESTER | `POST /api/auth/login` | 401 | 401 | PASS |
| 5 | Invalid sign-in creates no session | REQUESTER | `GET /api/auth/me` | 401 | 401 | PASS |
| 6 | Unknown email refused | REQUESTER | `POST /api/auth/login` | 401 | 401 | PASS |
| 7 | Unknown email creates no session | REQUESTER | `GET /api/auth/me` | 401 | 401 | PASS |
| 8 | REQUESTER valid sign-in | REQUESTER | `POST /api/auth/login` | 200 | 200 | PASS |
| 9 | REQUESTER current identity | REQUESTER | `GET /api/auth/me` | 200 | 200 | PASS |
| 10 | REVIEWER valid sign-in | REVIEWER | `POST /api/auth/login` | 200 | 200 | PASS |
| 11 | REVIEWER current identity | REVIEWER | `GET /api/auth/me` | 200 | 200 | PASS |
| 12 | Owner retrieves saved decisions | REQUESTER | `GET /api/requests/mine` | 200 | 200 | PASS |
| 13 | Assigned Reviewer queue empty | REVIEWER | `GET /api/requests/pending` | 200 | 200 | PASS |
| 14 | Requester forbidden Reviewer list | REQUESTER | `GET /api/requests/pending` | 403 | 403 | PASS |
| 15 | Requester forbidden decision | REQUESTER | `PATCH /api/requests/1/decision` | 403 | 403 | PASS |
| 16 | Reviewer forbidden Requester list | REVIEWER | `GET /api/requests/mine` | 403 | 403 | PASS |
| 17 | Reviewer forbidden submission | REVIEWER | `POST /api/requests` | 403 | 403 | PASS |
| 18 | Repeated approval cannot become rejection | REVIEWER | `PATCH /api/requests/1/decision` | 409 | 409 | PASS |
| 19 | Repeated rejection cannot become approval | REVIEWER | `PATCH /api/requests/2/decision` | 409 | 409 | PASS |
| 20 | Required-field rejection | REQUESTER | `POST /api/requests` | 400 | 400 | PASS |
| 21 | REQUESTER logout | REQUESTER | `POST /api/auth/logout` | 204 | 204 | PASS |
| 22 | REQUESTER after logout /auth/me | REQUESTER | `GET /api/auth/me` | 401 | 401 | PASS |
| 23 | REQUESTER after logout /requests/mine | REQUESTER | `GET /api/requests/mine` | 401 | 401 | PASS |
| 24 | REQUESTER after logout /requests/pending | REQUESTER | `GET /api/requests/pending` | 401 | 401 | PASS |
| 25 | REQUESTER after logout decision | REQUESTER | `PATCH /api/requests/1/decision` | 401 | 401 | PASS |
| 26 | REVIEWER logout | REVIEWER | `POST /api/auth/logout` | 204 | 204 | PASS |
| 27 | REVIEWER after logout /auth/me | REVIEWER | `GET /api/auth/me` | 401 | 401 | PASS |
| 28 | REVIEWER after logout /requests/mine | REVIEWER | `GET /api/requests/mine` | 401 | 401 | PASS |
| 29 | REVIEWER after logout /requests/pending | REVIEWER | `GET /api/requests/pending` | 401 | 401 | PASS |
| 30 | REVIEWER after logout decision | REVIEWER | `PATCH /api/requests/1/decision` | 401 | 401 | PASS |

Selected actual public response excerpts: only fields retained by the local evidence recorder are shown; identity email fields, credentials, cookie values and login request payloads are omitted.

| Role/context | Request | HTTP | Retained response fields |
|---|---|---|---|
| REQUESTER | `GET /api/auth/me` | 200 | `{"id":1,"role":"REQUESTER"}` |
| REVIEWER | `GET /api/auth/me` | 200 | `{"id":2,"role":"REVIEWER"}` |
| REQUESTER | `GET /api/requests/pending` | 403 | `{"error":"You do not have permission."}` |
| REQUESTER | `PATCH /api/requests/1/decision` | 403 | `{"error":"You do not have permission."}` |
| REVIEWER | `GET /api/requests/mine` | 403 | `{"error":"You do not have permission."}` |
| REVIEWER | `POST /api/requests` | 403 | `{"error":"You do not have permission."}` |
| REVIEWER | `PATCH /api/requests/1/decision` | 409 | `{"error":"This request has already been decided. Refresh the pending list."}` |
| REVIEWER | `PATCH /api/requests/2/decision` | 409 | `{"error":"This request has already been decided. Refresh the pending list."}` |
| REQUESTER | `POST /api/requests` | 400 | `{"error":"Enter both a title and description."}` |
| REQUESTER | `GET /api/auth/me` | 401 | `{"error":"Please sign in."}` |
| REVIEWER | `GET /api/auth/me` | 401 | `{"error":"Please sign in."}` |

Logout headers were inspected in memory. The saved evidence contains only the resulting boolean, not the header/cookie value:

| Prior role | Logout HTTP | Cookie value cleared and expiry in the past |
|---|---|---|
| REQUESTER | 204 | true |
| REVIEWER | 204 | true |

After applying browser-style cookie deletion, each role context received 401 for identity, both protected lists and a decision attempt. This verifies the chosen cookie logout design; it does not assert JWT revocation.

## Database evidence

Read-only capture checked the owned cluster marker and live user/database/data-directory/port identity before selecting public Request fields. The capture query used explicit UTC conversion for the timestamp-without-time-zone columns:

```sql
SELECT "id", "title", "description", "status", "requesterId",
       "assignedReviewerId", "reviewerId",
       "createdAt" AT TIME ZONE 'UTC' AS "createdAt",
       "decidedAt" AT TIME ZONE 'UTC' AS "decidedAt"
FROM "Request"
ORDER BY "id";
```

The earlier Pending snapshots recorded #1/#2 as PENDING, owner #1, assigned Reviewer #2, and null decision identity/time. After the user's actual UI decisions, the corrected final SQL capture returned:

```json
[
  {
    "id": 1,
    "title": "[PART-F-STAGE3] Approval demo",
    "description": "Synthetic request for the Part F approval demonstration.",
    "status": "APPROVED",
    "requesterId": 1,
    "assignedReviewerId": 2,
    "reviewerId": 2,
    "createdAt": "2026-11-12T19:08:10.041Z",
    "decidedAt": "2026-11-12T19:22:20.070Z"
  },
  {
    "id": 2,
    "title": "[PART-F-STAGE3] Rejection demo",
    "description": "Synthetic request for the Part F rejection demonstration.",
    "status": "REJECTED",
    "requesterId": 1,
    "assignedReviewerId": 2,
    "reviewerId": 2,
    "createdAt": "2026-11-12T19:08:36.186Z",
    "decidedAt": "2026-11-12T19:22:30.645Z"
  }
]
```

The supplementary owner `GET /api/requests/mine` returned both same IDs/statuses, deciding Reviewer and exactly matching UTC decision timestamps. Reviewer `GET /api/requests/pending` returned 200 with `[]`. The full captured records before and after the 409/403/400 attempts were equal, including row count, content, owner, assignment and timestamps:

```json
{
  "rejectionDatabaseUnchanged": true,
  "finalDatabaseUnchanged": true
}
```

No successful domain write was performed by those supplementary refusal/logout checks. The manual browser workflow created/decided only synthetic records in its verified disposable database. The separate automated test runner used its own fresh cluster. No development database was modified by this verification.

## Timestamp evidence correction

The first supplementary comparison exited **1** after ten recorded HTTP responses. Its actual mismatch was:

```text
FAIL: Expected values to be strictly equal:
+ actual - expected

+ '2026-11-12T19:22:20.070Z'
- '2026-11-12T12:22:20.070Z'
               ^
```

Raw inspection found `timestamp without time zone` columns. The generic reader applied Bangkok local time; Prisma's API and an explicit UTC SQL read agreed. For #1, the raw stored value was `2026-11-12 19:22:20.07`; the old reader incorrectly serialized it as `2026-11-12T12:22:20.070Z`. The corrected UTC value is `2026-11-12T19:22:20.070Z`. #2 had the same seven-hour reader offset.

Only ignored local evidence-query helpers were corrected to read UTC explicitly. The exact API/SQL equality assertion remained; a corrected 28-request run passed and the expanded final 30-request run passed. Application code and stored database values were unchanged. Earlier incorrect ISO snapshot displays are superseded by the corrected records above. Initial sandbox startup/bundling permission failures are also disclosed in the report; they were not application-test passes.

## Actual executed test excerpts

Source: [server/test/reviewer.test.ts](../../../../server/test/reviewer.test.ts) at `cfa33c0`. Both excerpts are preserved from the existing verified local evidence and correspond to passing names in the full backend output above. Per-case setup and assertions are shown; the complete file contains the synthetic authenticated-session fixtures.

### Pending-only rule — TEST-F03-06 / F-03 AC-06

```typescript
it.each(["APPROVED", "REJECTED"])("TEST-F03-06: refuses to replace an existing %s decision", async (first) => {
    const pending = await createPending();
    await decide(reviewer, pending.id, first).expect(200);
    const saved = await prisma.request.findUnique({ where: { id: pending.id } });
    await decide(reviewer, pending.id, first === "APPROVED" ? "REJECTED" : "APPROVED").expect(409);
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(saved);
  });
```

### Role/assignment restriction — TEST-F03-10 / F-03 AC-10

```typescript
it("TEST-F03-10: unrelated Reviewers cannot list or decide another assignment", async () => {
    const pending = await createPending();
    const list = await unrelated.get("/api/requests/pending").expect(200);
    expect(list.body.map((item: { id: number }) => item.id)).not.toContain(pending.id);
    const denied = await decide(unrelated, pending.id).expect(403);
    expect(denied.body).toEqual({ error: expect.any(String) });
    expect(await prisma.request.findUnique({ where: { id: pending.id } })).toEqual(pending);
    const legacy = await createPending(null);
    await decide(reviewer, legacy.id).expect(403);
  });
```

The distinct concurrency case TEST-F03-08 also passed after observing two actual blocked PostgreSQL UPDATE sessions; its full implementation is in the linked source. It verifies one 200/one 409 and winner metadata, rather than relying only on two Promise calls.

## Manual evidence boundary

The user explicitly confirmed the actual normal UI journey, final owner history/reload, Requester id/role, forbidden-access message and post-logout sign-in-required response. Those manual PASS records are detailed in [the verification report](../part-f-verification.md#manual-browser-checks-and-screenshot-deferral).

**Screenshot saving/inspection is DEFERRED — NOT COMPLETED.** No image is supplied or marked inspected here. Browser message-body confirmations and separately executed HTTP statuses are distinguished. No approval, reviewed release, new test execution or PDF is implied by this documentation handoff.
