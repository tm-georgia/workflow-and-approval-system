# Lab 5 - Cloud Readiness and Deployment Notes



## 1. Purpose



This document records the preparation completed for future deployment of the Workflow and Approval System to Google Cloud Run.



This lab prepares the application for deployment but does not deploy it or create additional Google Cloud resources.



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



The client currently does not require a custom environment variable for its API configuration.



The Vite development configuration proxies `/api` requests to the local backend at `http://localhost:3000`.



If the client API configuration changes in the future, document any new required variables in this file and update the example configuration accordingly.



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



## 7. Future Google Cloud Run Preparation



The following tasks are required before a future production deployment.



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



These are future preparation steps, not actions performed in this lab.



## 8. Current Verification Results



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



## 9. Deployment Readiness Summary



The application has been prepared for future Cloud Run deployment by documenting its environment variables, protecting local secrets, configuring the backend to listen on the appropriate network interface and port, and verifying database connectivity through its health endpoint.



The backend and frontend production builds completed successfully, and all 57 backend automated tests passed.



Actual production deployment, database provisioning, secret configuration, and Cloud Run resource setup remain future tasks.
