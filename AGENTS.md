# Activepieces

Open-source AI-first workflow automation platform (Zapier/Make alternative). Self-hosted or cloud. 400+ integration pieces. MCP support for AI agents.

## Business Models

- **Cloud**: 10 free active flows, then $5/flow/month (Stripe). 200 AI credits/month. Auto top-up via OpenRouter (1000 credits = $1).
- **Enterprise**: Self-hosted or cloud. License key from licensing server unlocks features (SSO, SCIM, audit logs, etc.). Trial support with expiration.
- **Embed**: Customers embed Activepieces in their own apps. Signing keys (RSA-4096) + JWT exchange via `managed-authn`. Embed SDK (iframe + postMessage). Connection cards. Custom domains.
- **Community (CE)**: Free, unlimited flows, core features only, no billing.

## Monorepo Structure

```
packages/
├── shared/              # @activepieces/shared — types, DTOs, Zod schemas, utilities
├── server/
│   ├── api/            # Fastify 5 REST API (TypeORM, BullMQ, ioredis)
│   ├── engine/         # V8 isolate flow execution engine (4 step executors)
│   ├── worker/         # BullMQ job consumers (piece provisioning, sandbox)
│   ├── utils/          # Server utilities
│   └── sandbox/        # Sandboxing infrastructure
├── web/                # React 18 frontend (Vite, Zustand, TanStack Query, Shadcn)
├── pieces/
│   ├── framework/      # Piece SDK (@activepieces/pieces-framework)
│   ├── common/         # Shared piece utilities (httpClient, pollingHelper)
│   ├── core/           # Core pieces (webhook, delay, schedule, tables, HTTP)
│   └── community/      # 400+ community integration pieces
├── ee/embed-sdk/       # Embed SDK (iframe + postMessage protocol)
├── cli/                # Piece management CLI
└── tests-e2e/          # Playwright E2E tests
```

## Architecture

- **Multi-tenant**: Platform → Projects → Users. ALL queries MUST filter by `projectId` or `platformId`.
- **Editions**: CE (`ce`), EE (`ee`), Cloud (`cloud`) via `AP_EDITION` env var. EE extends CE via `hooksFactory` pattern — **never import from `src/app/ee/` in CE code**.
- **Feature gating**: `platformMustHaveFeatureEnabled((p) => p.plan.myFlag)` on EE module hooks. PlatformPlan has 40+ feature flags + quota limits (`activeFlowsLimit`, `projectsLimit`).
- **Quota enforcement**: Checked at flow publish/enable. Throws `QUOTA_EXCEEDED` (HTTP 402).
- **Flows**: Immutable versioned (`FlowVersion` snapshots). All modifications go through single-endpoint `FlowOperationType` dispatch (NOT separate REST endpoints).
- **4 action types**: `CODE` (V8 isolate), `PIECE` (integration), `LOOP_ON_ITEMS` (array iteration), `ROUTER` (conditional branching with AND/OR logic).
- **Triggers**: `WEBHOOK` (push, instant) or `POLLING` (pull, cron-scheduled).
- **Execution**: Engine runs steps chained via `nextAction` linked list. V8 isolate sandbox (128MB limit). State backed up every 15s (zstd-compressed to S3).
- **Delays**: <10s = `setTimeout` in-process. >10s = flow pause + BullMQ delayed job for resume.
- **Pausing**: `PauseType.DELAY` (scheduled resume) or `PauseType.WEBHOOK` (external callback at `/v1/flow-runs/{id}/requests/{requestId}`).
- **Retries**: Exponential backoff (4 attempts, 2^n × 2s). Per-step `retryOnFailure` and `continueOnFailure` options.
- **Timeouts**: Flow-level via `FLOW_TIMEOUT_SECONDS`. No per-step timeout.
- **AI**: 8 providers (OpenAI, Anthropic, Google, Azure, OpenRouter, Cloudflare, Custom, Activepieces). AI Agents with streaming, tools (PIECE/FLOW/MCP), structured output.
- **MCP**: 15 built-in tools + dynamic flow tools. 3 transports (HTTP, streaming HTTP, SSE).
- **Piece loading**: Cached on worker, downloaded from API on miss. Hot-reload in dev via `AP_DEV_PIECES`.
- **Webhook responses**: Sync (blocks HTTP connection) vs async (returns immediately). Hooks: `context.run.stop()` / `context.run.respond()` / `context.run.pause()`.
- **Variable resolution**: `{{step.output.field}}` resolved via `propsResolver` → V8 eval in sandbox. Single token preserves type; multiple tokens stringify.
- **HTTP conventions**: `POST` for all create/update mutations. `DELETE` for deletes. Never PUT/PATCH.
- **Security**: Every endpoint needs `securityAccess` config. Principals: `USER`, `ENGINE`, `SERVICE`, `WORKER`, `UNKNOWN`.
- **Connections**: `PROJECT` or `PLATFORM` scoped. Use `projectIds` array with `ArrayContains()`.
- **Entity registration**: New entities MUST be added to `getEntities()` in `database-connection.ts` — TypeORM does NOT auto-discover.
- **Side effects**: Separated into `*-side-effects.ts` files, called explicitly after mutations.
- **Real-time**: Socket.IO rooms by `projectId`. Emit via `websocketService.to(projectId).emit(event, data)`.
- **Logging**: Pino structured — context object FIRST, message SECOND: `log.info({ flowId }, 'Flow created')`.

## Cross-Cutting Feature Checklist

### Step 0: Decide scope
- CE, EE, or both? If both → `hooksFactory` pattern (CE default + EE override registered in `app.ts`)
- Need a platform plan flag? → Add to `PlatformPlan` entity + `LicenseKeyEntity` type + plan constants in `packages/shared`
- Need a `Permission`? → Add to `Permission` enum in `packages/shared`
- Affects billing/quotas? → Add enforcement in controller
- Must work when embedded? → Check `EmbeddingState` in frontend, respect embed config
- Project-scoped or platform-scoped? → Filter queries accordingly

### Step 1: `packages/shared` — Types and DTOs
- Define Zod schemas + `z.infer` types in `src/lib/{domain}/`
- Export from `src/index.ts` barrel
- Bump version in `package.json` (patch for fixes, minor for new exports)

### Step 2: `packages/server/api` — Database + API
- **Entity**: `EntitySchema` + `BaseColumnSchemaPart` + `ApIdSchema`
- **Register entity**: Import + add to `getEntities()` in `database-connection.ts` (REQUIRED)
- **Migration**: Read [playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration) → create class → import in `postgres-connection.ts` → add to `getMigrations()` array → handle PGlite vs Postgres
- **Service**: Function factory `(log: FastifyBaseLogger) => ({...})` if logging needed (dominant, 59 files), plain object `= {...}` for simple CRUD (21 files)
- **Controller**: `FastifyPluginAsyncZod`, route config objects AFTER controller function, `securityAccess` with `ProjectResourceType`
- **Project ownership**: Add `entitiesMustBeOwnedByCurrentProject` preSerialization hook if returning project-scoped data
- **Module**: Register in `app.ts` (CE section or EE section based on edition)
- **EE-only**: Put in `src/app/ee/`, gate with `platformMustHaveFeatureEnabled((p) => p.plan.myFlag)`

### Step 3: `packages/server/worker` (if queued work needed)
- Add job type to `SystemJobName` enum or `WorkerJobType`
- Add handler, register in `app.ts` via `systemJobHandlers.registerJobHandler()`

### Step 4: `packages/web` — Frontend
- Feature folder: `src/features/{feature}/api/`, `hooks/`, `components/`
- Route: `React.lazy()` + `ProjectRouterWrapper()` + `RoutePermissionGuard` + `SuspenseWrapper`
- Translations: add keys to `packages/web/public/locales/en/translation.json` only
- Feature flags: `flagsHooks.useFlag()` or `<FlagGuard flag={flagId}>`

### Step 5: Write tests
- API test: `packages/server/api/test/integration/ce/{feature}.test.ts`
- Use `setupTestEnvironment()` + `createTestContext(app)` → `ctx.post()`, `ctx.get()`
- DB auto-cleaned between tests (TRUNCATE CASCADE + seeds)

### Step 6: Verify
```bash
npm run lint-dev
npm run test-api
```

## File Structure

- **Exported types and constants must be placed at the end of the file**, after all logic (functions, hooks, components, classes, etc.).

## Coding Conventions

- **No `any` type** — use `unknown` with type guards
- **No type casting** — no `as SomeType`
- **No deprecated APIs** — check JSDoc, prefer `z.enum` over `z.nativeEnum`
- **No lodash** — ESLint ERROR. Use native JS alternatives.
- **Go-style error handling** — `tryCatch()` / `tryCatchSync()` from `@activepieces/shared`
- **Zod error messages must be i18n keys** — use `formErrors` from `@activepieces/shared` or keys from `packages/web/public/locales/en/translation.json`. Never raw English strings.
- **`@activepieces/shared` version bump** — any change requires version bump (patch for fixes, minor for new exports)
- **Helper functions** — define non-exported helpers outside of const declarations
- **File order**: Imports → Exported functions/constants → Helper functions → Types/constants at END
- **Comments** — only explain *why*, never *what*

## Key Utilities (from `@activepieces/shared`)

- `apId()` — generate unique 21-char IDs
- `tryCatch()` / `tryCatchSync()` — Go-style `{ data, error }` returns
- `spreadIfDefined(key, value)` / `spreadIfNotUndefined(key, value)` — conditional spread
- `isNil(value)` — null/undefined check
- `ActivepiecesError({ code: ErrorCode.X, params })` — typed error (33 codes → HTTP statuses)
- `SeekPage<T>` — cursor-based pagination response type
- `formErrors` — `{ required: 'required' }` for form validation i18n
- `BaseModelSchema` — `{ id, created, updated }` Zod base for all models

## Testing

- `npm run test-unit` — Vitest on engine + shared packages
- `npm run test-api` — API integration tests (CE, EE, Cloud editions)
- `npm run test:e2e` — Playwright E2E (runs post-merge)
- API tests: `setupTestEnvironment()` + `createTestContext(app)` → pre-authenticated `ctx.post()`, `ctx.get()`
- DB auto-cleaned between tests (TRUNCATE CASCADE + seeds)

## Common Commands

```bash
npm start              # Setup dev + start all services
npm run dev            # All services (frontend + backend)
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only
npm run lint-dev       # Lint with auto-fix (ALWAYS run before done)
npm run test-unit      # Unit tests
npm run test-api       # API integration tests
npm run build          # Full build
```

## Git Push

Always prefix with `CLAUDE_PUSH=yes` to auto-approve pre-push lint/test gate:
```bash
CLAUDE_PUSH=yes git push -u origin HEAD
```

## Database Migrations

Before creating or modifying a database migration, **always read the [Database Migrations Playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration)** first.

## Keeping Docs Current

Before implementing, verify patterns against 1-2 real examples in the codebase. If CLAUDE.md conflicts with recent code, **trust the code** and update CLAUDE.md. When a PR changes a documented pattern, update the relevant CLAUDE.md in the same PR.

## Feature Map

### Server CE Modules (`packages/server/api/src/app/`)

| Module | Purpose |
|--------|---------|
| `flows/` | Flow CRUD, FlowVersion (draft/published), 26 FlowOperationType ops, folders, human-input (forms + chat) |
| `flows/flow-run/` | FlowRun lifecycle (12 statuses), logs (zstd), retry (from-failed-step/full), pause/resume, bulk ops |
| `flows/step-run/` | Sample data capture, test step execution |
| `tables/` | Built-in database: Table → Field (4 types) → Record → Cell. TableWebhooks (3 events). Bulk ops. |
| `trigger/` | TriggerSource lifecycle, TriggerEvent storage, AppEventRouting, deduplication, test modes |
| `webhooks/` | Webhook ingestion (5 routes), sync/async execution, handshake verification, payload offloading |
| `app-connection/` | 7 connection types, OAuth2 refresh with distributed lock, PROJECT/PLATFORM scope, encryption |
| `mcp/` | MCP server (4 locked + 11 controllable tools + dynamic flow tools), StreamableHTTP transport |
| `ai/` | 8 AI providers, model caching, Activepieces provider (OpenRouter), credit system |
| `pieces/` | Piece metadata registry, sync, dev watcher (hot-reload), community piece module |
| `platform/` | Platform settings, branding, auth config, piece filtering |
| `project/` | Project CRUD, settings, max concurrent jobs |
| `authentication/` | Sign-up/sign-in, JWT tokens (7-day user, 100-year engine/worker), session validation |
| `user/` | User management, badges (9 badges, event-driven awards), platform roles |
| `user-invitations/` | Project invitations with role assignment |
| `store-entry/` | Key-value store for flow state (Project/Flow/Run scopes) |
| `template/` | Flow/table templates (OFFICIAL/SHARED/CUSTOM), community templates from cloud API |
| `analytics/` | Platform analytics reports, pieces usage tracking, leaderboard (users + projects) |
| `event-destinations/` | Stream events to external webhooks (PLATFORM/PROJECT scope, 19+ event types) |
| `flags/` | Feature flags (42 ApFlagId values), CE defaults + EE hook overrides |
| `file/` | File storage (S3 with DB fallback), step files, signed URLs (7-day expiry) |
| `workers/` | Worker RPC, machine health (CPU/RAM/disk), job queue (BullMQ), payload offloader, rate limiter |
| `health/` | System health checks (CPU, RAM, disk, DB connectivity, worker detection) |

### Server EE Modules (`packages/server/api/src/app/ee/`)

| Module | Purpose | Plan Flag |
|--------|---------|-----------|
| `audit-logs/` | 19 event types, structured data, IP tracking | `auditLogEnabled` |
| `api-keys/` | Platform API key management (hashed, truncated) | `apiKeysEnabled` |
| `projects/project-members/` | Team collaboration, role assignment | — |
| `projects/project-role/` | 3 default roles (ADMIN/EDITOR/VIEWER) + custom | `projectRolesEnabled` / `customRolesEnabled` |
| `projects/project-release/` | Git sync, diff/apply, rollback, manual releases | `environmentsEnabled` |
| `global-connections/` | Platform-wide shared connections | `globalConnectionsEnabled` |
| `custom-domains/` | White-label domains (PENDING → ACTIVE) | `customDomainsEnabled` |
| `signing-key/` | RSA-4096 keys for embedding JWT exchange | `embeddingEnabled` |
| `managed-authn/` | JWT exchange for embedded auth, auto user/project creation | `embeddingEnabled` |
| `secret-managers/` | AWS, Vault, CyberArk, 1Password. Redis cache (1hr). | `secretManagersEnabled` |
| `scim/` | SCIM 2.0: Users + Groups (→ Projects), discovery endpoints | `scimEnabled` |
| `authentication/saml-authn/` | SAML SSO (login → IdP redirect → ACS callback) | `ssoEnabled` |
| `authentication/federated-authn/` | Google/GitHub OAuth SSO | `ssoEnabled` |
| `authentication/otp/` | One-time passwords (10-min expiry, email verification + password reset) | — |
| `authentication/enterprise-local-authn/` | Email verification + password reset via OTP | — |
| `authentication/project-role/` | RBAC enforcement (assertPrincipalAccessToProject) | — |
| `platform/platform-plan/` | PlatformPlan (40+ flags), Stripe billing, AI credits (OpenRouter), auto top-up | — |
| `license-keys/` | License activation, trial, expiration, feature mapping | — |
| `alerts/` | Flow failure email notifications | — |
| `oauth-apps/` | Custom OAuth2 app credentials per piece | — |
| `platform-webhooks/` | Platform event notifications to parent app (embedding) | — |
| `template/` | Platform-specific custom templates | `manageTemplatesEnabled` |
| `pieces/` | Platform piece management, installation | `managePiecesEnabled` |
| `platform/admin/` | Cloud admin: retry runs, apply license, increase credits, dedicated workers | — |

### Frontend Features (`packages/web/src/features/`)

agents, alerts, authentication, automations, billing, chat, connections, flow-runs, flows, folders, forms, members, pieces, platform-admin, project-releases, projects, secret-managers, tables, templates

### Core Pieces (`packages/pieces/core/`)

| Piece | Key Capability |
|-------|---------------|
| `approval` | Human-in-the-loop with webhook pause/resume URLs |
| `subflows` | Call other flows via HTTP + callback response |
| `schedule` | Cron triggers (every X min/hour/day/week/month + custom cron) |
| `delay` | Short (<10s: setTimeout) + long (>10s: flow pause + BullMQ resume) |
| `store` | Key-value storage with 3 scopes (Project/Flow/Run) |
| `forms` | Web forms + chat UI with file uploads, wait-for-response |
| `webhook` | Catch webhooks with auth (none/basic/header/HMAC), return response |
| `http` | Full HTTP client (7 methods, auth, proxy, retry, binary) |
| `tables` | CRUD + find with filters, 3 event triggers, clear table |
| `tags` | Add execution tags for API filtering |
| `connections` | Dynamic connection lookup by external ID |
| `data-mapper` | JSON structure transformation |
| `data-summarizer` | Average, sum, count uniques, min/max |
| `csv`, `pdf`, `graphql`, `sftp`, `smtp`, `crypto`, `qrcode`, `xml` | Utility pieces |

### Documentation (`docs/`)

User-facing Mintlify docs (202 pages). Published at `activepieces.com/docs`. **Not for AI — for end users.** Auto-generated API spec at `docs/openapi.json` (948KB). Engineering playbooks at `docs/handbook/`.

## Useful Links

- [Database Migrations Playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration)
- [TypeORM Migrations Docs](https://orkhan.gitbook.io/typeorm/docs/migrations)
