# Lab 5 - Cloud Readiness and Deployment Notes



## 1. Purpose



This document records the completed first Google Cloud deployment of the Workflow and Approval System and preserves the preparation notes that preceded it.



**Current status (22 November 2026):** Issue 5 deployment and the requester/reviewer approval workflow have succeeded. See [Section 13](#13-completed-issue-5-deployment-22-november-2026) for deployed resources, immutable images, execution IDs, HTTP results and evidence status. Four local screenshots have now been visually reviewed and indexed; they support service/job status, signed-in roles and the approved outcome. The submission/re-login/approval sequence remains user-confirmed; missing evidence is explicitly marked pending. Exposed demonstration credentials require rotation under separate authorization; no secret values are recorded here.

Sections 2-10 preserve earlier local-readiness checkpoints; Section 12 preserves the historical cloud preparation plan. Their references to future or unperformed cloud actions describe those checkpoints, not the current deployment. Historical commands are reference material, not instructions to rerun completed jobs or change resources. This documentation update changes no cloud resources, credentials, database records or Git history.



## 2. Environment Configuration



The application uses environment variables to separate configuration from source code.



### 2.1 Server Environment Variables



The server example configuration is located at `server/.env.example`.



| Variable | Required? | Purpose | Default / Example |

|---|---|---|---|

| `DATABASE\_URL` | Yes | PostgreSQL connection string used by Prisma | Safe placeholder in `.env.example` |

| `JWT\_SECRET` | Yes | Signs and verifies authentication tokens. Must contain at least 32 characters. | Safe placeholder in `.env.example` |

| `NODE\_ENV` | No | Selects the application environment. Production mode enables secure cookies. | Development when not set |

| `PORT` | No | Port on which the backend listens. Cloud Run provides this value. | `3000` |

| `HOST` | No | Network interface on which the backend listens. | `0.0.0.0` |

| `DESIGNATED\_REVIEWER\_EMAIL` | No | Default reviewer email for newly submitted requests. | `reviewer@example.test` |



`DATABASE\_URL` and `JWT\_SECRET` must be configured before the server can operate correctly.



The `.env.example` file contains placeholders only. Replace the placeholders with appropriate local configuration when running the application locally.



Do not commit real credentials, database connection strings, or authentication secrets.



### 2.2 Client Environment Variables



The browser uses same-origin `/api/` requests and does not require a Vite API URL variable. The production Nginx container accepts non-secret `BACKEND_URL` and `BACKEND_AUTH_MODE` settings; see section 11 for the private-backend configuration.



The Vite development configuration proxies `/api` requests to the local backend at `http://localhost:3000`.



When `BACKEND_URL` is omitted, the container defaults to the local Docker Compose backend. Changing this setting requires a container restart or a new Cloud Run revision, but does not require rebuilding the frontend image.



## 3. Environment File and Secret Protection



The repository `.gitignore` excludes environment files and secrets while allowing `.env.example` files to be committed.



The actual local server environment file is `server/.env`.



The example file is `server/.env.example`.



Before committing changes, verify that actual environment files are not tracked:



```powershell

git ls-files | Select-String '(^|/)\\.env($|\\.)'

```



The example configuration should remain available to other developers, but actual `.env` files must not be committed.



For a future production deployment, store sensitive values such as `DATABASE\_URL` and `JWT\_SECRET` in Google Secret Manager or another approved secrets manager. Do not place production secrets in source code or deployment documentation.



## 4. Server Network Configuration



The backend entry point is `server/src/index.ts`.



The server uses:



\- `PORT` from the environment, with `3000` as the local fallback.

\- `HOST` from the environment, with `0.0.0.0` as the fallback.



The backend listens on the configured host and port.



Binding to `0.0.0.0` allows the application to accept connections through the container network interface. This is necessary for a Cloud Run container to receive incoming traffic.



Cloud Run provides the `PORT` environment variable. The application must listen on that port.



## 5. Health Check and Database Connectivity



The backend provides the health endpoint:



`GET /api/health`



The endpoint executes a database query using Prisma:



```sql

SELECT 1

```



It returns the following response when the database is available:



\*\*HTTP status: 200\*\*



```json

{

&#x20; "status": "ok",

&#x20; "database": "connected"

}

```



If the database query fails, it returns:



\*\*HTTP status: 500\*\*



```json

{

&#x20; "status": "error",

&#x20; "database": "disconnected"

}

```



This ensures that the health endpoint does not report the application as healthy when its database is unavailable.



The endpoint depends on a working PostgreSQL connection. A future production deployment must provide valid database connectivity before the application can pass this health check.



## 6. Local Readiness Verification



Run the following checks from the repository root or the appropriate project folder.



### 6.1 Backend Production Build



```powershell

cd server

npm run build

```



This runs the TypeScript type check and generates the backend production bundle.



### 6.2 Frontend Production Build



```powershell

cd ../client

npm run build

```



This checks and builds the frontend using Vite.



### 6.3 Backend Automated Tests



```powershell

cd ../server

npm test

```



The local test runner creates an isolated temporary PostgreSQL test cluster. It uses synthetic test data rather than the normal application database configuration.



It applies migrations, seeds the isolated test database, runs the automated tests, and stops the temporary database server.



### 6.4 Health Endpoint Tests



The file `server/test/health.test.ts` verifies:



1. The endpoint returns HTTP `200` when the database query succeeds.

2. The endpoint returns HTTP `500` when the database query fails.



Run the health tests separately with:



```powershell

npx vitest run test/health.test.ts

```



## 7. Historical Google Cloud Run Preparation



The following tasks were identified before the first production deployment. Completed Issue 5 results are recorded in Section 13.



1. Create or select an approved Google Cloud project and enable the required services.

2. Prepare a container image for the backend application.

3. Configure Cloud Run to use the container's listening port through the `PORT` environment variable.

4. Ensure the application listens on `0.0.0.0`.

5. Configure PostgreSQL connectivity using an approved managed database or other supported PostgreSQL host.

6. Store production database credentials and `JWT\_SECRET` securely using Secret Manager.

7. Configure an appropriate service account and grant only the permissions required by the application.

8. Plan and apply database migrations using a controlled deployment process.

9. Configure the health check to use `/api/health`.

10. Deploy only after the project owner or team approves the deployment.



These were future preparation steps at the original local-readiness checkpoint; this list is retained as historical context.



## 8. Historical Local Verification Results



The following checks were completed during this lab:



| Check | Result |

|---|---|

| Backend TypeScript check and production build | Passed |

| Frontend production build | Passed |

| Existing backend automated tests | Passed |

| Health endpoint success test | Passed |

| Health endpoint database failure test | Passed |

| Complete backend test suite after adding health tests | 57 tests passed |

| Temporary PostgreSQL test cluster cleanup | Passed |

| Actual `.env` file ignored by Git | Verified |

| `.env.example` available for Git tracking | Verified |



No Google Cloud Run deployment or additional Google Cloud resources were created as part of this lab.



## 9. Historical Deployment Readiness Summary



The application has been prepared for future Cloud Run deployment by documenting its environment variables, protecting local secrets, configuring the backend to listen on the appropriate network interface and port, and verifying database connectivity through its health endpoint.



The backend and frontend production builds completed successfully, and all 57 backend automated tests passed.



At this local-readiness checkpoint, production deployment, database provisioning, secret configuration and Cloud Run setup were still future tasks. Section 13 records their subsequent completion.

## 10. Docker and Clean Build

### 10.1 Docker Configuration

The project supports local containerized development and production-style testing using Docker and Docker Compose.

The Docker configuration includes:

- `server/Dockerfile`: Builds the backend using a multi-stage Docker build.
- `client/Dockerfile`: Builds the React frontend and serves it using Nginx.
- `server/.dockerignore`: Excludes unnecessary backend files from the Docker build context.
- `client/.dockerignore`: Excludes unnecessary frontend files from the Docker build context.
- `client/nginx.conf`: Startup template that serves the frontend and forwards `/api/` requests to the configured backend.
- `client/docker-entrypoint.d/19-backend.envsh`: Validates the backend origin and prepares the Nginx template settings at container startup.
- `docker-compose.yml`: Defines the PostgreSQL database, migration service, backend, and frontend.

### 10.2 Docker Services and Ports

Docker Compose starts the following services:

| Service | Purpose | Host Port |
|---|---|---|
| client | React frontend served by Nginx | 3000 |
| server | Express backend API | 4000 |
| db | PostgreSQL database | 5433 |
| migrate | Applies database migrations | No published port |

The backend listens on port `3000` inside its container and is exposed on host port `4000`.

The frontend is available at:

`http://localhost:3000`

The backend health endpoint is available directly at:

`http://localhost:4000/api/health`

The frontend Nginx configuration forwards API requests to the backend using the internal Docker service address:

`http://server:3000`

### 10.3 Building and Starting the Application

Run the following commands from the repository root.

Build the Docker images:

```powershell
docker compose build
```

Start the application:

```powershell
docker compose up -d
```

Docker Compose starts PostgreSQL, waits for the database health check, applies database migrations, and then starts the backend and frontend services.

Check the running services:

```powershell
docker compose ps
```

### 10.4 Database Migrations

The `migrate` service runs Prisma migrations before the backend starts.

It uses:

```powershell
docker compose logs migrate
```

A successful migration should report:

`All migrations have been successfully applied.`

Database migrations create or update the database schema. Demo account seeding is a separate operation and is not automatically performed by the migration service.

### 10.5 Health Checks and API Proxy

The PostgreSQL service uses `pg_isready` to check database availability.

The backend health check requests:

`http://127.0.0.1:3000/api/health`

The backend reports a healthy status only when its database connection is working.

The frontend Nginx server forwards API requests to the backend container through the Docker network.

### 10.6 Stopping and Restarting Containers

To stop the application:

```powershell
docker compose stop
```

To start the existing containers again:

```powershell
docker compose start
```

To stop and remove the Compose containers and network:

```powershell
docker compose down
```

The named database volume is preserved when using `docker compose down`.

Do not use `docker compose down -v` unless intentionally deleting the local database volume and its stored data.

### 10.7 Clean Rebuild

To rebuild the application images without using cached build layers:

```powershell
docker compose build --no-cache
```

Then start the application:

```powershell
docker compose up -d
```

Check the service status and logs:

```powershell
docker compose ps
docker compose logs
```

The PostgreSQL database uses a named volume to preserve its data across container recreation.

### 10.8 Local Docker Verification

The following Docker checks were performed:

| Check | Result |
|---|---|
| Docker Compose configuration validation | Passed |
| Backend Docker image build | Passed |
| Frontend Docker image build | Passed |
| Database container startup | Passed |
| Database health check | Passed |
| Prisma migration service | Passed |
| Backend container health check | Passed |
| Frontend container startup | Passed |
| Backend health endpoint | Passed |
| Frontend-to-backend API proxy | Passed |

The local Docker application is accessible through the frontend at `http://localhost:3000`.

These checks verify the local containerized setup. They do not represent a production deployment to Google Cloud Run.

## 11. Public Frontend with an IAM-Protected Backend

**Option A is the approved architecture. The earlier plan allowing unauthenticated backend invocation is obsolete and must not be executed.** Only the frontend is public. The backend requires Cloud Run IAM authentication in addition to the application's existing cookie authentication and roles.

```text
Browser -> HTTPS public frontend (Nginx ingress, port 80)
                 | internal auth subrequest -> token helper (sidecar, port 8081)
                 |                            -> Google metadata identity endpoint
                 -> HTTPS backend + Google ID token + application cookie
                        -> Cloud Run IAM -> Express roles -> Cloud SQL PostgreSQL
```

### 11.1 Runtime Configuration

| Component / setting | Behavior |
|---|---|
| Nginx `BACKEND_URL` | Backend HTTPS origin, preserving `/api/` and queries. Omission keeps `http://server:3000` for local Compose. |
| Nginx `BACKEND_AUTH_MODE` | Defaults to `none` for local Compose; `google` enables the internal token subrequest. Cloud Run startup rejects `none` or a missing mode. Invalid modes fail startup. |
| Helper `BACKEND_AUDIENCE` | Required canonical HTTPS `run.app` service origin, obtained from the backend's `status.url`; no credentials, custom domains, port, path, query or fragment. One trailing slash is normalized. |
| Helper `PORT` | Defaults to 8081; the prepared frontend manifest explicitly uses 8081. |
| Frontend ingress port | Deliberately fixed at 80. Nginx does not dynamically consume `PORT`. Only Nginx declares a public container port; the helper does not. |

Changing the backend origin requires a new container/revision configuration, not a React rebuild. Both frontend containers run as the frontend service account. No service-account keys, database credentials, bootstrap passwords or application JWT signing key are supplied to either frontend container.

### 11.2 Identity and Proxy Security

The helper uses the pinned Google `google-auth-library` package. `Compute` fetches the attached service identity from metadata; `IdTokenClient` provides an expiry-aware ID-token cache. It does not perform ADC JSON-file discovery. Metadata-host overrides are rejected by the deployed entrypoint. Concurrent requests share a refresh; a bounded deadline and sanitized failures prevent token-provider details from reaching logs/responses. Tokens must have the configured audience, Google issuer and sufficient remaining lifetime; Cloud Run performs signature and IAM verification.

Nginx obtains the token via `auth_request` to the exact `internal` location `/_backend_identity`. The helper receives a fixed GET `/token`, no browser request headers and no body. External requests to the internal location return 404. A successful subrequest exposes its token only to an internal Nginx variable; Nginx overwrites `X-Serverless-Authorization` on the backend request. Client-supplied service identity headers cannot select the service account or audience. Local mode strips those headers instead of forwarding spoofed identities.

The helper is not a public web service. Only Nginx port 80 is ingress; the helper's port is confined to the Cloud Run instance. `/health` verifies token availability without returning a token. Nginx waits for the helper startup probe. Token generation failure produces a generic 503 and no backend call; there is no unsigned fallback. Tokens are never stored in frontend bundles, environment settings or Secret Manager. Nginx hides service-identity response headers, disables internal-location access logging, and uses warning-level error logging rather than header-level debug logging. Do not enable debug/credential logging in production.

The main proxy retains `/api/`, encoded paths/query strings, request bodies, cookies, the original HTTPS forwarding protocol, correct upstream Host/SNI, and certificate verification. The existing HTTP-only, Secure, SameSite=Lax application cookie remains separate from the Google service ID token. No CORS or requester/reviewer authentication redesign is needed.

This is **IAM-private**, not VPC-internal: the backend URL is network-reachable but denies unauthorized invocation. `ingress=all` is compatible with this identity boundary. VPC-internal ingress requires separately reviewed VPC routing; changing ingress alone would break ordinary service-to-service requests. The public frontend still exposes application login/API entry points; backend application authorization remains necessary.

### 11.3 Local Validation

The existing `docker-compose.yml` remains unchanged and needs no Google authentication or helper. Use the real Compose network only for read-only health checks; never run synthetic workflow writes against the existing local database.

```powershell
npm.cmd --prefix deploy/token-helper ci
npm.cmd --prefix deploy/token-helper run typecheck
npm.cmd --prefix deploy/token-helper test
docker compose config --quiet
docker build --platform linux/amd64 --tag workflow-client:lab5-private ./client
docker build --platform linux/amd64 --tag workflow-token-helper:lab5-private ./deploy/token-helper
npm.cmd --prefix deploy/token-helper run test:proxy
docker run --rm --add-host server:127.0.0.1 workflow-client:lab5-private nginx -t
```

The Docker integration test uses a dedicated network, synthetic identity provider, HTTPS fixture, and generated temporary certificates. It simulates a shared sidecar network namespace, not Cloud Run IAM itself. It checks credential/body isolation, header spoof replacement, endpoint isolation, token failure/recovery, response/log non-disclosure, local mode, path/query/body/cookie forwarding and TLS rejection. It never calls Google Cloud or an application database. Fixture containers, network and certificate files are cleaned up. Unit tests separately exercise Google's actual metadata client against a local mock metadata endpoint; the deployed entrypoint forbids that override.

CI's `Private Backend Proxy Checks` job runs these helper/configuration tests and Docker boundary checks without cloud credentials or deployment permissions.

References: [Google ID tokens](https://docs.cloud.google.com/docs/authentication/get-id-token), [Google's ID-token client](https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/idtokenclient.ts), [Cloud Run service authentication](https://docs.cloud.google.com/run/docs/authenticating/service-to-service), [Nginx authorization subrequests](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html), and [Cloud Run sidecars/startup ordering](https://docs.cloud.google.com/run/docs/configuring/services/containers).

## 12. Historical Issue 5 Preparation and Approval Gate

**Historical plan, not current inventory:** Sections 12.1-12.7 describe preparation and validation before the approved cloud phases. Section 13 supersedes their pending-deployment statements. Do not execute the sample creation, migration, provisioning or IAM commands against the completed deployment without a separately reviewed change plan.

### 12.1 Read-only Findings (21 November 2026)

These findings were checked with the installed Google Cloud CLI, not inferred from local containers:

| Item | Verified result |
|---|---|
| Git | `feature/lab5-issue-5-first-deployment`, baseline `d75786e`, local uncommitted preparation changes |
| Cloud SDK | 594.0.0; installed under the user's local Google Cloud SDK directory, outside the existing terminal PATH |
| Active identity | University account in the `mail.kmutt.ac.th` domain; account identifier omitted from this document |
| Default project | `cpe334-workflow-approval-2026` |
| Required APIs | `run.googleapis.com`, `artifactregistry.googleapis.com`, `sqladmin.googleapis.com`, `secretmanager.googleapis.com` enabled |
| Artifact Registry | `workflow-approval`, standard Docker repository in `asia-southeast1`; reported size 0 MB at inspection |
| Cloud Run services | None listed in the project |
| Cloud SQL instances | None listed in the project |
| Secret Manager secrets | None listed; secret values were not accessed |
| User-managed service accounts | Only the default compute service account was listed; dedicated application identities are not prepared yet |
| Local Compose | Database and backend healthy, frontend running, migration container exited |

No API enablement, IAM changes, cloud resource creation, uploads, deployment or production database operations were performed during preparation. An authenticated account and enabled APIs do not prove that deployment or public invocation permissions are available. Recheck this inventory immediately before approved execution.

### 12.2 Proposed Resources and Cost

The inventory above is historical; this local-only implementation did not refresh cloud state or create resources. Recheck existing resources before future approved execution.

| Resource | Planned configuration |
|---|---|
| Region / registry | `asia-southeast1` / `workflow-approval` in project `cpe334-workflow-approval-2026` |
| Frontend | `workflow-frontend`; public Nginx ingress plus internal helper. Each container has 1 vCPU and 256 MiB, totaling 2 vCPU / 512 MiB per active instance. Minimum 0, service maximum 2, concurrency 20, timeout 60 seconds. |
| Backend | `workflow-backend`; IAM invoker check enabled, no broad public invocation. Port 8080, 1 vCPU / 512 MiB, minimum 0, service maximum 1, concurrency 4. |
| SQL | `workflow-db` / database `workflow`; PostgreSQL 17, Enterprise, zonal, 10 GiB SSD, deletion protection, daily backups. `db-f1-micro` for the low-traffic lab, with `db-g1-small` as a separately approved upgrade. |
| Operations | Serial `workflow-migrate` and `workflow-provision-users` jobs; one task, parallelism 1, retries 0, 1 vCPU / 512 MiB, timeout 10 minutes. |

At this preparation checkpoint, the reviewed backup choices were proposed, not provisioned: window 03:00 UTC (10:00 Bangkok), retain 3 successful backups, Singapore backup location, initial PITR disabled, storage auto-growth capped at 20 GiB. Subsequent verified configuration is recorded in Section 13; the proposed PITR setting is not an additional verification of its deployed state. A read-only SQL tier lookup previously confirmed `db-f1-micro` availability in Singapore. Shared-core SQL is test/development sizing without the SQL SLA. It is not a production-availability recommendation.

The earlier **unverified $15-25/month micro / $35-50/month small** allowance is historical planning guidance, not a fresh Singapore quote. The helper increases frontend billable resources; recompute the estimate for 730 SQL hours, 10 GiB SSD, actual backup/image storage, secret versions/access, request-billed Run usage and internet egress. Same-region traffic avoids cross-region charges. Minimum instances remain zero; budget alerts and instance limits are not hard spending caps. Review [SQL](https://cloud.google.com/sql/pricing), [Run](https://cloud.google.com/run/pricing), [Registry](https://cloud.google.com/artifact-registry/pricing) and [Secret Manager](https://cloud.google.com/secret-manager/pricing) pricing before execution. Spending approval does not authorize this local-only task to perform cloud mutations.

### 12.3 Environment Variables and Secrets (Names Only)

| Consumer | Environment names |
|---|---|
| Nginx | `BACKEND_URL`, `BACKEND_AUTH_MODE` |
| Token helper | `BACKEND_AUDIENCE`, `PORT` |
| Backend | `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `HOST`, `DESIGNATED_REVIEWER_EMAIL`; `PORT` supplied by Run |
| Migration job | `DATABASE_URL` |
| Provisioning job | `DATABASE_URL`, `REQUESTER_EMAIL`, `REVIEWER_EMAIL`, `REQUESTER_PASSWORD`, `REVIEWER_PASSWORD` |

Secret names remain `workflow-database-url`, `workflow-migration-database-url`, `workflow-jwt-secret`, `workflow-requester-password`, and `workflow-reviewer-password`. Use pinned numeric versions and newly generated database/account passwords and a fresh high-entropy JWT key. Never reuse Compose/demo credentials or the build placeholder. No Google ID token or service-account JSON key belongs in Secret Manager or frontend configuration.

Attach SQL to backend/operations only. Connection secrets use the socket directory `/cloudsql/cpe334-workflow-approval-2026:asia-southeast1:workflow-db` in the URL `host` query parameter with correctly encoded credentials/query values. Keep schema `public`. Do not authorize broad direct database networks. Prefer separate migration/schema-owner and runtime database identities; grant runtime database connect, schema usage, table DML and sequence usage after migrations. IAM connectivity does not replace database authentication or SQL grants.

### 12.4 Least-privilege IAM

| Principal | Scope |
|---|---|
| `workflow-frontend` | `roles/run.invoker` on **workflow-backend only**; no SQL or secret access |
| `workflow-backend` | `roles/cloudsql.client`; Secret Accessor only on runtime database/JWT secrets |
| `workflow-operations` | Cloud SQL Client; Secret Accessor only on migration/runtime database and bootstrap-password secrets |
| Publisher/deployer | Registry Writer/Reader as needed, Run Developer, and Service Account User on approved runtime identities |
| IAM administrator | Approved permission to configure service/project IAM and public access for the frontend only |

Do not grant frontend Token Creator, Editor, database access, or application secret access. Metadata provides its own attached identity without downloaded keys or impersonation. Both frontend containers share that same narrowly scoped identity. The backend must have the invoker IAM check enabled and no `allUsers`/`allAuthenticatedUsers` invocation grants, including inherited grants. Trusted administrative access is separate from routine invocation. Only the frontend is granted public Run invocation. University organization policy must permit that public demonstration endpoint.

### 12.5 Prepared Cloud Run Configuration and Future Commands

**Historical approval gate:** At the local-only preparation checkpoint, no image upload, cloud job, IAM change or service deployment below had been executed. Later cloud phases were separately approved and completed; Section 13 records their results. These examples are not an exact transcript of those phases: the final migration execution also applied and verified the restricted runtime SQL grants. The example tag below is not the uploaded release tag. Do not rerun this sequence against the existing deployment. The templates and renderer prepare local YAML; they do not themselves deploy resources.

`deploy/cloudrun/backend.template.yaml` enables IAM authentication and contains pinned Secret Manager references. `frontend.template.yaml` declares Nginx as the only ingress container, the internal helper, startup probes, Google auth mode, and startup dependencies. Templates include per-revision scaling safeguards; the explicit `services update --max` commands below also set service-level maxima. **Do not deploy raw templates.** `deploy/render-cloudrun.mjs` requires approved-registry image digests, numeric secret versions, normalized email and canonical audience, quotes YAML values safely, and writes only beneath ignored `.local/`.

Build the operations image with **`--target operations`**, never `builder`. This dedicated stage starts from a clean Node base, copies installed dependencies, the generated Prisma client, schema/migrations, provisioning script and required configuration only, and runs as the non-root `node` user. It does not inherit the builder's placeholder `DATABASE_URL` or copy the demo seed, application tests, `.env` files or `.env.example`. Development files remain in the repository. Its default command only prints the Node version; jobs must explicitly select their command and supply `DATABASE_URL` through Secret Manager at runtime, plus the account inputs for provisioning.

```powershell
$Gcloud = Join-Path $env:LOCALAPPDATA 'Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
$Project = 'cpe334-workflow-approval-2026'
$Region = 'asia-southeast1'
$Registry = "${Region}-docker.pkg.dev/${Project}/workflow-approval"
$Tag = 'lab5-private-v1'
$BackendImage = "${Registry}/backend:${Tag}"
$FrontendImage = "${Registry}/frontend:${Tag}"
$OperationsImage = "${Registry}/operations:${Tag}"
$HelperImage = "${Registry}/token-helper:${Tag}"
$SqlConnection = "${Project}:${Region}:workflow-db"
$BackendAccount = "workflow-backend@${Project}.iam.gserviceaccount.com"
$FrontendAccount = "workflow-frontend@${Project}.iam.gserviceaccount.com"
$OperationsAccount = "workflow-operations@${Project}.iam.gserviceaccount.com"

# Local-only dependency installation/builds.
npm.cmd --prefix deploy/token-helper ci
npm.cmd --prefix deploy/token-helper run build
docker build --platform linux/amd64 --target production --tag $BackendImage ./server
docker build --platform linux/amd64 --target production --tag $FrontendImage ./client
docker build --platform linux/amd64 --target operations --tag $OperationsImage ./server
docker build --platform linux/amd64 --tag $HelperImage ./deploy/token-helper

# Future approved uploads only.
docker push $BackendImage
docker push $FrontendImage
docker push $OperationsImage
docker push $HelperImage

# Resolve reviewed digests; refuse empty/failed results.
foreach ($name in @('backend','frontend','operations','token-helper')) {
  $taggedImage = "${Registry}/${name}:${Tag}"
  $digest = & $Gcloud artifacts docker images describe $taggedImage --project=$Project --format='value(image_summary.digest)'
  if ($LASTEXITCODE -ne 0 -or -not $digest) { throw 'Image digest lookup failed.' }
  $variable = @{backend='BackendImage';frontend='FrontendImage';operations='OperationsImage';'token-helper'='HelperImage'}[$name]
  Set-Variable -Name $variable -Value "${Registry}/${name}@${digest}"
}

# Non-secret metadata only; secret values must be handled separately and securely.
$RuntimeDbVersion = Read-Host 'Runtime database secret version number'
$MigrationDbVersion = Read-Host 'Migration database secret version number'
$JwtVersion = Read-Host 'JWT secret version number'
$RequesterVersion = Read-Host 'Requester password secret version number'
$ReviewerVersion = Read-Host 'Reviewer password secret version number'
$RequesterEmail = (Read-Host 'Approved requester email').Trim().ToLowerInvariant()
$ReviewerEmail = (Read-Host 'Approved reviewer email').Trim().ToLowerInvariant()
```

After approval, apply both committed migrations once through the operations image; never use development migrations, schema push, reset, or the demo seed against Cloud SQL. Back up existing data before future schema changes. Unassigned legacy requests from the second migration need a separately reviewed backfill if relevant.

```powershell
$JobArgs = @("--project=$Project", "--region=$Region", "--image=$OperationsImage",
  "--service-account=$OperationsAccount", "--set-cloudsql-instances=$SqlConnection",
  '--tasks=1', '--parallelism=1', '--max-retries=0', '--cpu=1', '--memory=512Mi', '--task-timeout=10m', '--command=npm')
& $Gcloud run jobs create workflow-migrate @JobArgs --args='run,migrate,--,--config,prisma7.config.ts' `
  --set-secrets="DATABASE_URL=workflow-migration-database-url:${MigrationDbVersion}"
& $Gcloud run jobs execute workflow-migrate --project=$Project --region=$Region --wait
```

Stop until migration status/success and runtime SQL grants are verified. Then use create-only provisioning, which atomically refuses existing emails without changing passwords/roles:

```powershell
& $Gcloud run jobs create workflow-provision-users @JobArgs --args='run,provision:users' `
  --set-env-vars="REQUESTER_EMAIL=${RequesterEmail},REVIEWER_EMAIL=${ReviewerEmail}" `
  --set-secrets="DATABASE_URL=workflow-database-url:${RuntimeDbVersion},REQUESTER_PASSWORD=workflow-requester-password:${RequesterVersion},REVIEWER_PASSWORD=workflow-reviewer-password:${ReviewerVersion}"
& $Gcloud run jobs execute workflow-provision-users --project=$Project --region=$Region --wait
```

Render/apply the private backend, then grant only the frontend identity routine invocation access:

```powershell
node deploy/render-cloudrun.mjs backend --backend-image $BackendImage --service-account $BackendAccount `
  --reviewer-email $ReviewerEmail --runtime-db-version $RuntimeDbVersion --jwt-version $JwtVersion --out .local/cloudrun/backend.yaml
& $Gcloud run services replace .local/cloudrun/backend.yaml --project=$Project --region=$Region
& $Gcloud run services update workflow-backend --project=$Project --region=$Region --invoker-iam-check --min=0 --max=1
& $Gcloud run services get-iam-policy workflow-backend --project=$Project --region=$Region
```

**IAM gate:** verify no broad service or inherited invocation binding exists. If the service has an old public binding, an approved administrator must remove it before proceeding; removing a service binding does not fix inherited project access. The following removal commands are conditional, only for confirmed existing bindings:

```powershell
& $Gcloud run services remove-iam-policy-binding workflow-backend --project=$Project --region=$Region --member=allUsers --role=roles/run.invoker
& $Gcloud run services remove-iam-policy-binding workflow-backend --project=$Project --region=$Region --member=allAuthenticatedUsers --role=roles/run.invoker
```

```powershell
& $Gcloud run services add-iam-policy-binding workflow-backend --project=$Project --region=$Region `
  --member="serviceAccount:${FrontendAccount}" --role=roles/run.invoker
$BackendUrl = & $Gcloud run services describe workflow-backend --project=$Project --region=$Region --format='value(status.url)'
node deploy/render-cloudrun.mjs frontend --nginx-image $FrontendImage --helper-image $HelperImage `
  --backend-url $BackendUrl --service-account $FrontendAccount --out .local/cloudrun/frontend.yaml
& $Gcloud run services replace .local/cloudrun/frontend.yaml --project=$Project --region=$Region
& $Gcloud run services update workflow-frontend --project=$Project --region=$Region --invoker-iam-check --min=0 --max=2
& $Gcloud run services add-iam-policy-binding workflow-frontend --project=$Project --region=$Region --member=allUsers --role=roles/run.invoker
$FrontendUrl = & $Gcloud run services describe workflow-frontend --project=$Project --region=$Region --format='value(status.url)'
```

No backend command grants public access or disables its IAM check. Do not add a helper ingress port, a public helper service, long-lived token environment setting, or JSON service-account key. Backend health is suitable for startup/smoke checks, not database-dependent liveness restarts. Frontend helper startup health checks identity availability before Nginx starts. Schema changes are not undone by application revision rollback. Remove bootstrap-password access/job retention only through separately approved cleanup.

### 12.6 Historical Verification Plan and Additional Checks

The preparation plan proposed the checks below. Deployment and the Issue 5 approval workflow are now complete as recorded in Section 13. This historical list includes additional hardening and later persistence checks; it is not a claim that every item was executed or required for Issue 5.

1. Reviewed source snapshot, test/build results, image digests, registry region, ready backend/frontend revisions, and both frontend containers with correct ports/dependency.
2. Backend IAM check enabled; frontend-only routine invocation permission; no broad backend grants. Frontend identity has no database/JWT-secret access. Capture identities/roles and secret references, never values.
3. SQL configuration and successful migration/provisioning job outcomes, with both migrations applied and fresh production verification accounts.
4. Public frontend login page and proxied health 200, direct unauthenticated backend health 403, proxied unauthenticated identity 401, and external helper location 404.
5. Additional proposed coverage: approval and rejection paths, wrong-role operations and repeated decisions. The completed Issue 5 demonstration used one request and one approval, not two requests. Restart/redeploy persistence belongs to later Issue 8 verification; a fresh requester sign-in alone does not prove persistence across restart/redeploy. Do not create more records or redeploy merely to complete this historical checklist.
6. Secure/HTTP-only/SameSite cookie attributes with values hidden; token expiry/refresh and failure-recovery tests; no service tokens in browser responses or logs.
7. Singapore cost estimate, budget alerts and approved cleanup/retention plan.

```powershell
curl.exe --silent --output NUL --write-out "%{http_code}\n" "$FrontendUrl/"
curl.exe --silent --output NUL --write-out "%{http_code}\n" "$FrontendUrl/api/health"
curl.exe --silent --output NUL --write-out "%{http_code}\n" "$BackendUrl/api/health"
curl.exe --silent --output NUL --write-out "%{http_code}\n" "$FrontendUrl/api/auth/me"
curl.exe --silent --output NUL --write-out "%{http_code}\n" "$FrontendUrl/_backend_identity"
```

Expected status sequence for these five historical commands is 200, 200, 403, 401, 404. Section 13 records the four requested final HTTP checks (200 / 200 / 403 / 404). Direct backend checks must not include browser credentials or authorization headers. Local fixtures alone cannot prove Google signatures, effective Cloud Run IAM or production SQL reachability; later live verification established the deployed path. Do not print identity tokens to test service invocation.

The repository's SDS calls for one public client/API origin, Cloud Run, SQL, Secret Manager and Artifact Registry; the private-backend proxy preserves that design and existing requester/reviewer behavior. The locally reviewed teacher handout (`01_SE_Lab_5_updated.pdf`, Section 7) distinguishes Issue 5's public URL/sign-in demonstration from Issues 6-8's merge gate, repeatable release and restart/redeploy persistence. Issue 5 completion does not certify those later issues. Future CI/CD must deploy both frontend images together, preserve IAM policy and test through the frontend or an authorized service identity. Monitoring can target public proxied health or an authenticated internal check; rollback must preserve compatible helper/backend revisions and the canonical audience.

### 12.7 Local Validation Status

The following results were verified locally on 21 November 2026; earlier build/test tables describe historical runs.

| Check | Result |
|---|---|
| Helper TypeScript check/build and unit/configuration tests | Passed; 22 tests, including real Google library metadata requests to a local mock, cache/refresh, failure/timeout, audience validation, and deployment-template checks |
| Docker proxy integration | Passed; spoof replacement, internal endpoint isolation, browser header/body isolation, failure with no backend call, recovery, response/log non-disclosure, local mode and TLS verification failures |
| Backend TypeScript/production build | Passed |
| Existing backend tests and smoke checks | 67 tests passed; both built-server workflow/restart smoke checks passed in a fresh isolated PostgreSQL cluster, which stopped successfully |
| Frontend tests and TypeScript/Vite production build | 19 tests passed; build passed |
| Docker builds | Frontend, token helper, backend and operations images built locally as `linux/amd64`; no upload |
| Real local Compose compatibility | Only the frontend container was rebuilt/recreated with `--no-deps`; frontend/root and proxied/backend health returned 200, unauthenticated identity returned 401; original database/backend stayed healthy |
| Local manifest rendering | Frontend/backend fixtures rendered from synthetic digests; YAML parsed in tests and IAM/port/secret-reference boundaries checked |
| Documentation and Git | 23 PowerShell blocks parsed without syntax errors; `git diff --check` passed |

At this local-validation checkpoint, no cloud resources, IAM, secrets or existing local database records were changed. Local test databases were fresh isolated fixtures only. Docker proxy fixtures/network/generated certificate files were removed. Logs remain ignored under `.local/lab5-private/` and `.local/verification/`; review/redact before sharing. Live token acquisition, backend denial, production SQL connectivity and the public workflow were not verified by these local tests; subsequent deployment and live results are recorded in Section 13.

Operations-image security follow-up (22 November 2026): local `operations` and `production` target builds passed. The dedicated operations image runs as `node`, has no credential environment defaults and retains only the required application files; all 11 final-image layers (15,406 regular-file entries) were inspected without finding the known repository development credential literals or excluded application files. PEM-header matches in upstream dependency/npm documentation were checked and were not parseable private keys. In a disposable PostgreSQL 17 cluster with SCRAM authentication, networking disabled and a shared Unix socket mounted at the Cloud SQL connection path, both migrations and repeat deployment passed as the restricted schema owner. Provisioning passed as the restricted runtime role, duplicate provisioning preserved existing passwords, and missing configuration/wrong database credentials failed closed. The backend production command/environment/ports and compiled application matched the previous local image. Disposable database containers, socket volumes and the image-inspection archive were removed. No production resources or secrets were accessed. Future uploads must use a newly built `--target operations` image, not an older builder-stage image.

References: [Cloud Run IAM authentication](https://docs.cloud.google.com/run/docs/authenticating/service-to-service), [ingress versus IAM](https://docs.cloud.google.com/run/docs/securing/ingress), [multi-container services](https://docs.cloud.google.com/run/docs/configuring/services/containers), [SQL attachment](https://docs.cloud.google.com/sql/docs/postgres/connect-run), and [production migrations](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production).

## 13. Completed Issue 5 Deployment (22 November 2026)

### 13.1 Deployment Results and Provenance

**Completed:** first deployment, production database migration/provisioning, private-backend HTTP verification and the requester/reviewer approval demonstration. This section consolidates the completed deployment records, the user's live workflow confirmation and the four locally inspected screenshots indexed in Section 13.6. No cloud checks, logins or database writes were repeated for this documentation update. It does not claim that the Lab 5 submission PDF or later Issues 6-8 are complete.

| Item | Completed result |
|---|---|
| GCP project | `cpe334-workflow-approval-2026` |
| Region / Artifact Registry repository | `asia-southeast1` / `workflow-approval` |
| Backend service | `workflow-backend`, READY; revision `workflow-backend-00001-stc` |
| Backend canonical URL / token audience | <https://workflow-backend-wkjzb522ga-as.a.run.app> |
| Frontend service | `workflow-frontend`, READY; revision `workflow-frontend-00001-ww7` |
| Public demonstration URL | <https://workflow-frontend-wkjzb522ga-as.a.run.app> |
| Cloud SQL / application database | `workflow-db` / `workflow` |
| Cloud SQL connection name | `cpe334-workflow-approval-2026:asia-southeast1:workflow-db` |
| Scaling limits | Both services minimum instances **0**; backend maximum **1**, frontend maximum **2** |

Source baseline: merged PR #24, commit `d75786edad306ef02b911c2ee572db35052623b0`. The uploaded images were built from the local `feature/lab5-issue-5-first-deployment` working-tree snapshot, including the verified operations-image security fix. They must not be described as builds of the unchanged baseline commit. A source commit covering all deployed local changes remains to be recorded through the team's separate review process; this update does not commit changes or close [Issue #25](https://github.com/tm-georgia/workflow-and-approval-system/issues/25).

The sanitized local deployment manifests are available at `.local/cloudrun/phase5-20261122-a7bdb46b/backend.yaml` and `.local/cloudrun/phase5-20261122-a7bdb46b/frontend.yaml`. These ignored local files are configuration evidence, not saved screenshots or a submitted report.

### 13.2 Verified Immutable Images

All four images were built for `linux/amd64`, uploaded to the existing Singapore repository and verified remotely. Shared upload tag: **`lab5-20261122-aebfaf55dfce`**. Deployments/jobs use immutable digest references, not the historical example tag in Section 12.5.

| Image | Dockerfile / context / target |
|---|---|
| operations | `server/Dockerfile` / `server` / **`operations`**, never `builder` |
| backend | `server/Dockerfile` / `server` / `production` |
| frontend | `client/Dockerfile` / `client` / `production` |
| token-helper | `deploy/token-helper/Dockerfile` / `deploy/token-helper` / `production` |

Exact verified references:

```text
asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/operations@sha256:5753667423f4bb4582f4226b1e737411d7dd547508bf6bdae52b52ea9d2494bf
asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/backend@sha256:ee86081fe107946ccf93e086c8c068f1279a052860c37e4e0df1358e9f78e04c
asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/frontend@sha256:35855693af57d402948c04ce572196fb7ae650840fe464b57e3d9645d3764191
asia-southeast1-docker.pkg.dev/cpe334-workflow-approval-2026/workflow-approval/token-helper@sha256:5b60e073893b9ebc1d9c8f6a00d565c4e5aea9f509f7f73e7d79284d3afbf113
```

### 13.3 Database, Migration and Provisioning Results

Cloud SQL `workflow-db` is RUNNABLE: PostgreSQL 17, Enterprise edition, `db-f1-micro`, zonal in `asia-southeast1-c`, 10 GiB SSD, automatic storage increase capped at 20 GiB and deletion protection enabled. Automated backups start at 03:00 UTC (10:00 Bangkok), retain three successful backups and use `asia-southeast1`. The assigned public IP has no authorized public client networks; backend/jobs use the authenticated Cloud SQL attachment and Unix socket. Cloud SQL continues to incur cost even when Cloud Run scales to zero; Section 12.2's estimates remain historical and unverified pricing.

| Job | Successful execution ID | Recorded outcome |
|---|---|---|
| `workflow-migrate` | `workflow-migrate-lcx8q` | Executed once successfully; both migrations and restricted runtime grants verified |
| `workflow-provision-users` | `workflow-provision-users-98z7q` | Executed once successfully; exactly the two intended accounts provisioned and roles verified |

Both jobs used the approved operations image, `workflow-operations@cpe334-workflow-approval-2026.iam.gserviceaccount.com` and the existing SQL attachment. Each used one task, parallelism one, zero retries, 1 vCPU, 512 MiB and a 600-second timeout; neither has a public HTTP endpoint.

Applied migrations: `20261107063128_init` and `20261112000000_reviewer_assignment`. Migrations ran as `workflow_migrator`, not the PostgreSQL administrator. After table creation, `workflow_runtime` received database CONNECT, schema USAGE, SELECT and INSERT on `public."User"` and `public."Request"`, UPDATE only on `Request.status`, `Request.reviewerId` and `Request.decidedAt`, and USAGE on `User_id_seq` and `Request_id_seq`. No DELETE, schema creation, broad UPDATE or Prisma migration-history access was granted to the runtime user.

Provisioned identities: `lab5-requester@example.test` (REQUESTER) and `lab5-reviewer@example.test` (REVIEWER). The create-only provisioning script uses `bcryptjs` with cost 12 and refuses existing accounts rather than modifying passwords. Database, JWT and demonstration credentials were freshly generated for production; local development/demo passwords were not reused. No passwords, hashes or credential-bearing connection strings are included here.

Secret references used for the deployment, shown by name/version only:

| Consumer | Secret references |
|---|---|
| Backend | `workflow-database-url:1`, `workflow-jwt-secret:1` |
| Migration job | `workflow-migration-database-url:1` |
| Provisioning job | `workflow-database-url:1`, `workflow-requester-password:1`, `workflow-reviewer-password:1` |

### 13.4 Completed Security Architecture and IAM

- **Public frontend:** `allUsers` has `roles/run.invoker` on `workflow-frontend`. Public delivery of the login page and same-origin API is intentional; application authentication/roles still protect workflow operations.
- **IAM-private backend:** the invoker IAM check is enabled. `workflow-frontend@cpe334-workflow-approval-2026.iam.gserviceaccount.com` has `roles/run.invoker` on **workflow-backend only**. Neither `allUsers` nor `allAuthenticatedUsers` has backend invocation permission. Backend network ingress is `all`; privacy is enforced by Cloud Run IAM, not a claim of VPC-only ingress.
- **Internal token helper:** Nginx is the frontend ingress container on port 80; the helper has no public ingress port. The attached frontend service account obtains short-lived Google-signed identity tokens through the metadata server, using the canonical backend URL as audience. Nginx obtains the token through an internal auth subrequest and sends it upstream in `X-Serverless-Authorization`; browser cookies, bodies and authorization headers are excluded from the helper request. Tokens are not returned to the browser or logged; token acquisition failure fails closed. HTTPS upstream certificate verification, Host/SNI, `/api` paths, query strings, bodies, forwarding information and application cookies are preserved.
- **Backend runtime:** port 8080, `HOST=0.0.0.0`, production mode, dedicated backend service account and SQL attachment. The frontend has neither SQL attachment nor application-secret access. Both services have minimum instances zero.
- **Least-privilege identities:** backend and operations service accounts have project-level `roles/cloudsql.client`. Each has `roles/secretmanager.secretAccessor` only on its individual secrets from Section 13.3; `workflow-database-url` grants access to both accounts. The frontend's invoker grant is service-scoped, not project-wide. No service-account JSON keys are used.

**Security follow-up — pending credential rotation:** demonstration credentials have been reported exposed and the affected account passwords must be rotated before further demonstration use or handoff. No secret values, exposure channel or unverified exposure scope are recorded. Rotation requires a separately authorized, coordinated update of the affected application password hashes and corresponding Secret Manager password versions. Changing a secret alone does not change an existing user's password, and rerunning the create-only provisioning job is not a rotation mechanism. No credentials were changed by this documentation task. Earlier clean image inspections describe their inspection scope and do not negate this subsequent exposure report.

### 13.5 Completed HTTP and Live Workflow Verification

The final unauthenticated HTTP checks passed in the deployed environment:

| Check | Actual HTTP status | Result |
|---|---|---|
| Frontend `https://workflow-frontend-wkjzb522ga-as.a.run.app/` | **200** | PASS: public frontend |
| Frontend `https://workflow-frontend-wkjzb522ga-as.a.run.app/api/health` | **200** | PASS: authenticated frontend-to-backend proxy and database-backed health check |
| Direct backend `https://workflow-backend-wkjzb522ga-as.a.run.app/api/health`, without authentication | **403** | PASS: backend denies unauthenticated invocation |
| Frontend `https://workflow-frontend-wkjzb522ga-as.a.run.app/_backend_identity` | **404** | PASS: internal helper location inaccessible externally |

Recorded sequence: **200 / 200 / 403 / 404**. Together with the verified service identity/IAM and deployment configuration, these results establish public frontend access and the IAM-authenticated proxy to the private backend. No identity tokens were printed for verification.

The user confirmed the following successful production workflow. The saved screenshots independently support the signed-in roles and approved outcome, but do not capture the submission, approval click or sign-out/re-login sequence. These are not claimed as an additional assistant-executed browser test:

| Step | User-confirmed result |
|---|---|
| Requester authentication | `lab5-requester@example.test` signed in successfully |
| Submission | Requester created **Request #1** |
| Reviewer action | `lab5-reviewer@example.test` signed in and approved Request #1 |
| Requester verification | After signing in again, requester saw **APPROVED** for Request #1 |
| Decision details | Reviewer identity and decision timestamp were displayed |

The inspected [requester screenshot](evidence/05-requester-approved.png) shows the signed-in REQUESTER, title **`LAB5-ISSUE5-LIVE-VERIFICATION`**, **APPROVED**, and **Decision by Reviewer #2 on 11/22/2026, 4:51:53 AM**. This is the browser-displayed timestamp; its timezone is not shown and no UTC/Bangkok conversion is asserted. The numeric request ID is not displayed in the screenshot, so the identification as Request #1 comes from the user's verification record. The [reviewer screenshot](evidence/04-reviewer-dashboard.png) shows the signed-in REVIEWER and no assigned pending requests; it does not show an approval action or decision history. This evidence and the user-confirmed sequence support the workflow and persistence across sign-ins, not persistence across a service restart/redeployment. No extra requests, migrations, provisioning runs or deployments were performed to prepare this record.

### 13.6 Evidence Index and Remaining Documentation Work

All four expected PNG files exist in `docs/labs/lab05/evidence/` and were visually inspected without modifying them. Links below are relative to this document. No visible passwords, password hashes, JWTs, service identity tokens, secret values or credential-bearing connection strings were found. Console screenshots include a creator's university email and profile avatars; these are personal identifiers, not authentication secrets. Review whether to omit those identifiers from a separately prepared submission copy. Screenshot originals remain unchanged. This visual review does not establish that previously exposed demonstration credentials have been rotated.

**Screenshot coverage:** `01-cloud-run-services.png` shows green service status indicators, both service names, Singapore region, backend "Require authentication" and frontend "Public access". It does not show individual IAM principals, image digests, revisions or scaling settings, and the GCP project ID/browser URL is not visible. `02-migration-jobs.png` shows both jobs' last execution as "Succeeded" in Singapore, but not execution IDs, migration history, SQL grants or account contents. Both application screenshots show the deployed frontend hostname and signed-in account/role; the requester screenshot shows the approved decision. The faint white workspace headings have low contrast, but roles, title, outcome and decision details are readable. No `03-*.png` was supplied; the numbering gap alone is not a missing requirement.

The final Lab 5 PDF is not indexed here. Remaining **PENDING** entries identify evidence not supplied in these four screenshots; they do not mean the recorded deployment failed or authorize rerunning it. Add numbered captions and the relevant Issue 5/rubric identifier in the submission PDF. Redact passwords, cookies, tokens, hashes and secret values. Manifests and ignored logs remain supporting local records and must be reviewed before sharing.

| Evidence ID | Fact / existing record | Screenshot or submission artifact status |
|---|---|---|
| E5-01 | Public frontend hostname and signed-in requester/reviewer roles | **VERIFIED screenshots:** [requester](evidence/05-requester-approved.png), [reviewer](evidence/04-reviewer-dashboard.png). The login form or login exchange is not pictured; successful login is user-confirmed. |
| E5-02 | Existing production request and its approved result; Request #1 per user record | **VERIFIED screenshot:** [request history](evidence/05-requester-approved.png), title `LAB5-ISSUE5-LIVE-VERIFICATION`. Submission action and numeric request ID are not pictured; no additional test request is required for this review. |
| E5-03 | Approved outcome, reviewer identity and decision timestamp; reviewer authenticated | **VERIFIED screenshots:** [approved requester view](evidence/05-requester-approved.png), [reviewer dashboard](evidence/04-reviewer-dashboard.png). Approval action and requester re-login sequence remain user-confirmed; the reviewer view only shows an empty pending queue. |
| E5-04 | Both deployed services healthy in `asia-southeast1`; backend requires authentication, frontend public | **VERIFIED screenshot:** [Cloud Run services](evidence/01-cloud-run-services.png). **PENDING detail evidence:** exact project ID, revision IDs, ports, sidecar and minimum instances zero; local manifests support the documented configuration. |
| E5-05 | Frontend service-scoped backend Invoker, no public backend grant, public frontend | **PARTIAL screenshot:** [access modes](evidence/01-cloud-run-services.png). **PENDING:** service IAM binding screenshots; authentication-mode labels do not prove the exact principals/roles. Owner screenshots were reported but are not indexed locally. |
| E5-06 | HTTP results 200 / 200 / 403 / 404; Section 13.5 | **PENDING:** save sanitized status-only verification evidence and URLs; never include authorization headers |
| E5-07 | SQL RUNNABLE/configuration, existing `workflow` database; Section 13.3 | **PENDING:** save sanitized instance/database configuration screenshots; omit credentials and unnecessary IP details |
| E5-08 | Migration and provisioning jobs succeeded; detailed execution records in Section 13.3 | **VERIFIED screenshot:** [Cloud Run jobs](evidence/02-migration-jobs.png), both last executions Succeeded. **PENDING detail evidence:** `workflow-migrate-lcx8q`, `workflow-provision-users-98z7q`, migration history/runtime grants/two roles; these are not shown in this overview. Omit passwords/hashes. |
| E5-09 | Four uploaded immutable images, shared tag and build targets; Section 13.2 | **PENDING:** save Artifact Registry digest/tag evidence matching all four references |
| E5-10 | Secret names/version references and resource-level access; Sections 13.3-13.4 | **PENDING:** save names/IAM/reference evidence only; never open secret values for a screenshot |
| E5-11 | PR #24 baseline plus local deployment/security changes; Section 13.1 | **PENDING:** record the reviewed source revision covering deployed changes through the separately authorized team process |
| E5-12 | Evidence assembled for the teacher's required Lab 5 PDF | **PENDING:** create/index the final PDF in the separate submission task; no PDF was created by this update |

Minimum follow-up: obtain separately authorized rotation of exposed demonstration credentials; add the missing supporting evidence for the HTTP results, exact IAM bindings and detailed deployment/database/image records; add captions and assemble the required submission PDF. The four supplied screenshots already support signed-in roles and the approved result; an approval-click screenshot is not claimed and no new request is needed. Functional Issue 5 deployment is complete; evidence packaging, credential rotation and later-issue verification must not be represented as complete.

**GitHub submission steps, for a separately approved action:** review the full existing working-tree diff and explicitly select the Issue 5 source/configuration changes, this document and the four reviewed screenshots; exclude secrets, `.env` files and ignored `.local/` records. Record a source revision covering the deployed changes, then commit/push the feature branch and open a PR to the team's approved integration branch referencing Issue #25. Include the public URL, immutable image references, execution IDs, evidence links and the credential-rotation follow-up. Obtain teammate review and successful current CI checks (server, client and private proxy); integrate through the team's release process. Update the Issue #25 checklist/evidence and close it only after acceptance and separate authorization. This task performs none of these GitHub actions; Issue #25 is left open, and no remote issue/PR status was refreshed during this local review.
