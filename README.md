# workflow-and-approval-system
CPE 334 Workflow and Approval System

## Local prerequisites

- Windows PowerShell, PostgreSQL 18 tools/server, and Node 24.15 or a compatible newer runtime (the locked jsdom version requires at least Node 24.15 on the Node 24 line).
- Install locked dependencies with `npm ci` in both `server` and `client`.
- Create your private `server/.env` yourself with `DATABASE_URL` and a long random `JWT_SECRET` (at least 32 characters). Keep it untracked; never put real values in screenshots or reports. This task does not create or edit `.env` files.
- Optional `DESIGNATED_REVIEWER_EMAIL` selects an existing Reviewer; the synthetic demo default is `reviewer@example.test`. `PORT` and `HOST` default to `3000` and `127.0.0.1`. Use `HOST=0.0.0.0` behind the appropriate production/container network and TLS setup.

## Database and development

From `server`, run:

```powershell
npm run generate
npm run migrate
npm run seed
npm run dev
```

The migration adds nullable assignment without deleting/backfilling existing records. Only new submissions receive the configured server assignment; an old unassigned request cannot be reviewed. Any desired backfill needs a separate reviewed decision. The seed upserts synthetic demo users defined in `server/prisma/seed.ts`; use it only with a development database and never reuse demo credentials for real accounts.

In another terminal, from `client`, run `npm run dev`. Vite proxies `/api` to the backend on port 3000; adjust the development proxy if you deliberately change the backend port.

## Build and run

```powershell
# server
npm run generate
npm run typecheck
npm run build
npm start

# client (separate terminal)
npm run build
npm run preview
```

The server build writes an ESM bundle to `server/dist/index.js`. Runtime npm dependencies remain external and must be installed. Vite preview serves built client files; production hosting must route `/api` to the backend on the same origin. Development uses Vite's proxy. HTTPS and production secure-cookie behavior are part of the deployment setup.

## Verification without touching the development database

From `server`, run:

```powershell
npm test -- --reporter=verbose
# After a fresh server build, include the real HTTP/restart smoke check:
npm test -- --smoke --reporter=verbose
```

The test runner ignores inherited/developer database configuration. It initializes a fresh PostgreSQL cluster owned by a synthetic `workflow_test` database identity, listens only on loopback on an available port, applies migrations, seeds synthetic users, runs tests, and stops the cluster. It generates its JWT secret in memory and never prints it. No existing database is deleted or reset. Synthetic records and execution logs remain in ignored `.local/verification/<run-id>/`. Existing regression test cleanup is confined to this newly created cluster. On Windows, the runner may need permission to create PostgreSQL's restricted process token; it must run under the same OS user that owns its test cluster.

`PG_BIN` can override the directory containing `initdb`/`pg_ctl` (default `C:/Program Files/PostgreSQL/18/bin`). Keep commands on the same machine; this is a local test harness, not cloud deployment tooling. The synthetic trust-authenticated test cluster is stopped after verification and should never be exposed to a public interface.

From `client`, run `npm test` and `npm run build`. Frontend tests simulate API responses; the backend tests and optional built-server smoke check establish real database behavior. Full commands/results and local version identity are recorded in [the Sprint 1 verification report](docs/sprints/sprint-1/verification.md).

Review [the feature contracts](docs/sprints/sprint-1/F-03-reviewer.md) and [Product DoD](docs/sprints/sprint-1/product-dod.md) before claiming acceptance. Teammate review and Git submission/integration remain separate approval steps.
