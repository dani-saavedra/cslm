# CSLM — Certificate & Secret Lifecycle Manager

Centralized inventory and lifecycle management for digital certificates and secrets used by an
organization's applications: ownership, environments, deployment locations, expiration risk
(semaphore), dependency graphs, notifications and audit trail.

## Architecture

```
┌─────────────┐      HTTPS/JSON       ┌───────────────────┐        JDBC        ┌───────────┐
│  Frontend   │  ───────────────────▶ │      Backend       │ ─────────────────▶│   MySQL   │
│ React + MUI │  ◀───────────────────  │ Spring Boot 3 / 21 │                    │    8.x    │
│ (nginx)     │      JWT bearer       │  REST + Security   │                    └───────────┘
└─────────────┘                       │  Flyway migrations  │
                                       │  Spring Scheduler   │──▶ SMTP (MailHog in dev)
                                       └───────────────────┘
```

**Backend** — Java 21 / Spring Boot 3, package-by-feature (`domain`, `repository`, `service`,
`controller`, `dto`, `security`, `audit`, `scheduler`). REST controllers never expose JPA entities
directly — everything goes through DTOs. Flyway owns the schema (`V1__init_schema.sql`,
`V2__seed_data.sql`).

**Data model highlights**
- `Application` ⟷ `Certificate`/`Secret` is many-to-many via `application_assets` (an asset can
  belong to more than one application, and vice versa).
- `Certificate`/`Secret` carry a single `environment_id` (matches how the domain is described:
  one certificate instance per environment).
- `asset_deployments` records *where* an asset is actually running (Kubernetes, OpenShift, VM,
  F5, load balancer, API gateway, database, cloud service, other) — configurable via
  `location_types`/`deployment_locations`, not hardcoded.
- Semaphore thresholds live in `system_settings` (admin-editable), not hardcoded constants.
- Every create/update/delete on the main entities is written to `audit_log` via `AuditService`.

**Security** — Spring Security + a self-issued JWT (`/api/auth/login`). Roles: `ADMIN` (full
CRUD + admin config + user/role management), `OPERATOR` (create/update certificates, secrets,
applications, deployments and their links, no delete, no admin config), `VIEWER` (read-only).
Designed so a later OAuth2/OIDC/SSO integration only needs to replace the login endpoint / token
issuance, not the authorization model.

**Notifications** — `NotificationRule` defines configurable day-before thresholds (90/60/30/15/7/1/0,
enable/disable each independently). A daily `@Scheduled` job (`ExpirationNotificationJob`) checks
every certificate/secret against enabled rules, sends an email via Spring Mail, and records the
result (sent or failed) in `notification_history`, de-duplicated per (asset, rule, day).

**Dependency graph** — `GraphService` builds a nodes/edges JSON consumed by the frontend with
[React Flow]. Two directions: certificate/secret → applications → environment → deployment
locations, and application → environments → certificates/secrets (inverted view).

**Frontend** — Vite + React + TypeScript + MUI + React Router + Axios. Screens: Login, Dashboard
(summary, semaphore overview, upcoming expirations), Certificates (list/detail/dependency graph),
Secrets (list/detail — the real secret value is never stored or shown), Applications
(list/detail with grouped-by-environment assets + graph), Environments (CRUD), Notifications
(history), Administration (teams, asset types, location types, deployment locations, notification
rules, semaphore thresholds, users).

## Running locally with Docker Compose

```bash
cp .env.example .env   # adjust values if you want; defaults work out of the box
docker compose up --build
```

- Frontend: http://localhost:8081
- Backend / Swagger UI: http://localhost:8080/swagger-ui.html
- MailHog (inspect emails sent by the notification job/test button): http://localhost:8025
- MySQL: localhost:3306 (`cslm` / `cslm` by default)

Demo users (seeded by Flyway):

| Username | Password     | Role     |
|----------|--------------|----------|
| admin    | Admin123!    | ADMIN    |
| operator | Operator123! | OPERATOR |
| viewer   | Viewer123!   | VIEWER   |

Seed data includes 4 applications (Corporate Banking, Mobile Banking, Payments, Treasury), 5
environments (Desarrollo, Laboratorio Proyectos, Laboratorio Contención, Laboratorio
Postproducción and the productive Producción — each flagged productive / non-productive), and
certificates/secrets spanning every semaphore state (green/yellow/orange/red/expired) so the
dashboard and lists are meaningful on first login.

## Running the acceptance flow (CLAUDE.md §26)

1. Log in as `admin`.
2. Applications → New application.
3. Environments → New environment (or reuse the seeded "Producción").
4. Certificates → New certificate, pick the environment above and link the application.
5. Open the certificate detail → "View dependencies" to see the graph
   (Certificate → Application → Environment → Deployment location).
6. Open the application detail to see Application → Environments → Certificates/Secrets.
7. Edit the certificate's expiration date — the semaphore updates immediately.
8. Administration is not needed to see it: check `/api/audit-log` (or the audit log is visible
   via the API) to confirm the `expirationDate` change was recorded.
9. From the certificate/secret detail page, click "Send test notification" — it is sent through
   MailHog (view it at http://localhost:8025) and appears in Notifications → history.

This exact flow is also covered by an automated integration test
(`CertificateLifecycleIntegrationTest`).

## Running without Docker

**Backend** (needs Java 21 and a MySQL 8 instance):
```bash
cd backend
DB_HOST=localhost DB_NAME=cslm DB_USERNAME=cslm DB_PASSWORD=cslm ./gradlew bootRun
```

**Frontend** (needs Node 20+):
```bash
cd frontend
npm install
npm run dev   # proxies /api to http://localhost:8080 by default (see vite.config.ts)
```

## Tests

```bash
cd backend
./gradlew test
```

Includes a unit test for the semaphore thresholds (`SemaphoreServiceTest`) and a full
`@SpringBootTest` integration test that exercises the acceptance flow end-to-end against an
in-memory H2 database.

## Environment variables

See `.env.example` for the full list (database credentials, SMTP, JWT secret/expiration, CORS
allowed origins, notification schedule). Nothing sensitive is hardcoded in source or images.

## Project structure

```
CSLM/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── src/main/java/com/cslm/{config,security,domain,repository,dto,service,controller,
│   │                            exception,scheduler,audit}
│   ├── src/main/resources/{application.yml, db/migration/V1__init_schema.sql, V2__seed_data.sql}
│   └── src/test/java/com/cslm/...
└── frontend/
    └── src/{api,components,contexts,layout,pages,types}
```

## Known simplifications (MVP scope)

- Secret Manager/Vault integration is modeled (storage system + external reference) but not
  actually called — by design, per the spec ("CSLM administra únicamente el metadato").
- Audit history is exposed via `GET /api/audit-log` (admin-only); there is no dedicated audit
  screen in the frontend yet.
- Distributed/idempotent scheduling: the notification job is a single `@Scheduled` task today;
  its per-(asset, rule, day) de-duplication check means it is already safe to shard or move to a
  distributed scheduler later without changing behavior.
