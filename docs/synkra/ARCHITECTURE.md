# Architecture

## The big picture

Synkra Flow is one repository, one application, one database. It is a fork of
Activepieces 0.92.0 with our branding, our custom integrations, and our billing
layer on top.

We chose a fork over building from scratch because Activepieces is a mature
automation engine. Wrapping and extending it beats re-implementing it.

## Repository layout

synkra-flow/
├── packages/
│ ├── core/ # Shared libraries (shared, utils, piece-types, ...)
│ ├── pieces/
│ │ ├── framework/ # The piece authoring framework
│ │ ├── common/ # Shared HTTP and utility code for pieces
│ │ ├── community/ # ~800 community pieces from Activepieces
│ │ │ └── synkra-chat/ # OUR custom Synkra Chat piece
│ │ └── core/ # Core utility pieces (schedule, webhook, etc)
│ ├── server/
│ │ ├── api/ # The Fastify HTTP server
│ │ ├── engine/ # Runs individual flow steps
│ │ ├── worker/ # Picks up queued jobs
│ │ └── sandbox/ # Sandboxed piece execution
│ └── web/ # The React frontend
├── docs/ # This handbook
├── Dockerfile # Builds the production image
├── docker-compose.yml # Base compose
├── docker-compose.override.yml # Synkra-specific compose (ports, labels, networks)
└── .env # Secrets and config (NOT tracked)

## Containers

Four containers when running.

| Container | Image | Port | Purpose |
|---|---|---|---|
| synkra-flow-app | synkra-flow:latest | 8199:80 | HTTP server, serves the frontend and API |
| synkra-flow-worker | synkra-flow:latest | — | Runs queued flow executions |
| synkra-flow-postgres | pgvector/pgvector:0.8.0-pg14 | — | Database |
| synkra-flow-redis | redis:7.0.7 | — | Cache and job queue |

Managed by Docker Compose with project name `synkraflow`.

## Domains

| Domain | Purpose |
|---|---|
| flow.synkra.co.za | Main application. OAuth callbacks. Emails. Everything. |
| automations.synkra.co.za | Alias, kept for backward compatibility. |

Both domains are served by the same Traefik router via Docker labels in
`docker-compose.override.yml`.

## Networks

The app and worker join two Docker networks:

- `synkraflow` — internal, for talking to postgres and redis
- `coolify` — so Coolify's Traefik reverse proxy can reach us

The postgres and redis containers only join `synkraflow`. They are not exposed
to Traefik.

## Data flow

### Building an automation

1. User opens the builder UI at `/flows/:id`.
2. Frontend fetches piece metadata from `/api/v1/pieces`.
3. When the user clicks a step, the frontend asks the API for that piece's actions and props.
4. The API looks up the piece in `piece_metadata`.
5. The engine fetches the piece code as a `.tgz` and runs it in a sandbox.

### Running an automation

1. A trigger fires (webhook, schedule, or manual test).
2. The API creates a `flow_run` record and queues a job in Redis.
3. A worker picks up the job and asks the engine to run it.
4. The engine loads each piece's code, calls the piece's action, and captures the result.
5. The result is written to `flow_run` and shown in the History tab.

## Piece delivery

This is the most important thing to understand about the fork.

**We do not bundle piece code into the Docker image at runtime.** Activepieces
distributes pieces as downloadable `.tgz` archives. When a user opens a piece
in the builder, the API resolves it to a URL:

- Official pieces → `https://cdn.activepieces.com/pieces/bundled/...`
- Custom pieces → streamed from our own file storage (S3/Z1)

The engine downloads the `.tgz`, loads it in a sandbox, and executes it.

**Our custom pieces** live as `.tgz` archives in the platform's file storage.
They install through the platform's piece install service. The boot seed
(`bundled-pieces.service.ts`) installs them automatically on every app start.

**Why this matters:** to add a new custom piece, we build it, bundle it into a
`.tgz`, ship the `.tgz` inside the Docker image, and let the boot seed install
it. See [PIECES.md](./PIECES.md) for the full flow.

## Storage

All files (uploads, run logs, piece archives) go to Z1 S3 storage, not to our
server disk and not to the database.

Environment variables:
AP_FILE_STORAGE_LOCATION=S3
AP_S3_ENDPOINT=https://s3.z1storage.com
AP_S3_BUCKET=synkra-flow
AP_S3_REGION=us-east-1
AP_S3_USE_SIGNED_URLS=true

## Database

One Postgres database, `activepieces`. The relevant tables:

| Table | Purpose |
|---|---|
| `platform` | One row. Holds branding, plan flags. |
| `platform_plan` | One row. Holds feature flags for the whole platform. |
| `user` | Users on the platform. |
| `user_identity` | Authentication records (email, password hash). |
| `project` | Workspaces. |
| `flow` | Automations. |
| `flow_run` | Execution history. |
| `piece_metadata` | Installed pieces. ~770 rows. |
| `app_connection` | User OAuth/API-key connections. |
| `synkra_subscription` | Our tier system. One row per user. |
| `synkra_usage` | (In progress) Metered usage counters. |

## Billing

We use Paystack for subscriptions. Tiers are defined in
`packages/core/shared/src/lib/synkra/plans.ts`. Enforcement lives in
`packages/server/api/src/app/synkra/billing/`.

See [BILLING.md](./BILLING.md) for the full system.

## Custom code locations

Everything Synkra-specific lives under:

- Backend: `packages/server/api/src/app/synkra/`
- Shared: `packages/core/shared/src/lib/synkra/`
- Frontend: `packages/web/src/features/synkra-billing/`, `packages/web/src/app/routes/billing/`, `packages/web/src/app/routes/glossary/`, `packages/web/src/lib/synkra-glossary.ts`
- Custom pieces: `packages/pieces/community/synkra-chat/`

If you need to find where something Synkra-specific lives, search for "synkra"
across those folders first.

---

## Addendum: 9 October 2026 (evening)

### Billing stack (all live)

Backend files under `packages/server/api/src/app/synkra/billing/`:
- `subscription.entity.ts` — DB row shape
- `subscription.service.ts` — read + write + scheduling (`scheduleCancel`,
  `scheduleDowngrade`, `reactivate`, `findDueRenewals`, `findDueReminders`)
- `subscription.controller.ts` — GET `/v1/synkra/subscription`, GET `/usage`,
  POST `/cancel`, POST `/reactivate`, POST `/downgrade`
- `checkout.service.ts` + `checkout.controller.ts` — POST `/v1/synkra/subscription/checkout`
- `paystack-client.ts` — Paystack API wrapper
- `paystack-webhook.controller.ts` — POST `/v1/synkra/paystack/webhook`
- `billing-email.service.ts` — 8 transactional templates
- `resend-sender.ts` — HTTP email via Resend (preferred)
- `renewals.service.ts` — hourly job (reminders, renewals, downgrades, cancels)
- `boot-seed.service.ts` — config sanity check on boot
- `bundled-pieces.service.ts` — installs our custom pieces on every boot
- `billing.module.ts` — registers everything

### Health + preflight

- `GET /api/v1/synkra/health` — always 200, no auth
- `GET /api/v1/synkra/preflight` — owner-only env-var checklist
- Frontend page: `/platform/preflight` (sidebar → Platform → Preflight)

### Email path

1. If `RESEND_API_KEY` is set → send via `https://api.resend.com/emails`
2. Else if `AP_SMTP_HOST` is set → send via nodemailer SMTP
3. Else → log to server, no send

### Payments path

1. Upgrade → POST `/v1/synkra/subscription/checkout` → Paystack authorize URL
2. User completes on Paystack → webhook fires `charge.success`
3. Backend calls `updateTier` with new tier + period end
4. If no Paystack keys → checkout throws, frontend shows "coming soon" banner

### Renewals

Hourly interval started on boot (`billing.module.ts`):
- 3 days before `currentPeriodEnd` → reminder email (once per period)
- On `currentPeriodEnd` → apply scheduled cancel/downgrade, or renew + extend
  by 30 days + send success email

Retries: Paystack handles them. Webhook `invoice.payment_failed` will be wired
in a future batch to send failure emails + eventually restrict.
