# Architecture Map: Decisions, Contexts & Module Rules

One page mapping the Activepieces codebase, grouped **by subsystem** — each section pulls together its architecture **decisions** (ADRs, recorded as top-level Craftspace Decisions — search the title to open the full why) and its **domain vocabulary** (`CONTEXT.md` glossaries). Cross-cutting **code conventions** (`CLAUDE.md`) sit in their own section at the end. Source of truth is the repo; this is the skimmable index.

Jump to: [Execution Runtime](#1-execution-runtime) · [Pieces](#2-pieces--integrations) · [Flows & Runs](#3-flows-runs--human-input) · [Webhooks, Events & Files](#4-webhooks-events--files) · [Platform, Auth & AI](#5-platform-tenancy-auth--ai) · [Code conventions](#6-code-conventions)

---

## 1. Execution Runtime
*How a flow job actually runs — the worker, the sandbox, the engine.*

**Decisions**
- **Worker is the sandbox** — worker + sandbox collapse into one unit, concurrency 1, scale by replicas; the Docker/Cloud Run pool is deleted.
- **Transitional multi-box worker concurrency** — honors `AP_WORKER_CONCURRENCY=N` (default 5) as N in-process boxes per container; a bridge to the concurrency-1 destination, not the architecture.
- **Sandbox pool as pure execute (superseded)** — the earlier Cloud-Run-at-concurrency-1 pool model; history, replaced by "Worker is the sandbox".
- **Engine posts run callbacks direct to app** — engine → app over HTTP (`POST /v1/engine/*`), worker removed from the callback path; `uploadRunLog` stays dual-sourced.

**Domain — Worker Runtime** (`packages/server/worker`)
- **Poll Loop** = pull → resolve → run-in-box → report; concurrency-1 destination, N loops in transitional mode.
- **Execution Cache** = content-addressed on-disk+in-memory store (one entry per `piece@version`, one per bundle), owned by `@activepieces/sandbox`, filled lazily.
- **Version Gate** = fail-closed worker↔app compat check before every poll; skew or `0.0.0` pauses polling.
- **Execution Slot** = one concurrent-flow unit (= Σ `AP_WORKER_CONCURRENCY`); exceeding it is **Queue-wait** vs the engine's actual **Service-time** (RUN phase), told apart via `FlowRun.timeline`.

**Domain — Sandbox Pool** (`packages/server/sandbox`)
- **Flow Bundle** = per-LOCKED-version `.tgz`/JSON (flow def + compiled Code Steps + frozen `pieces.json`); runs read it from object storage, not per-run DB.
- **Bundle Build** = lazy on first execution (API stores/serves, never builds); on miss the worker builds in-sandbox and uploads (once per `flowVersionId`); DRAFT always builds locally, LOCKED stored forever (no eviction).
- **Code Step** = user TS built via `bun install` + `esbuild`; a build error degrades into an `index.js` stub that throws at runtime → a FAILED step, not a retried INTERNAL_ERROR.

**Engine rules** (`packages/server/engine`)
- Always throw `ExecutionError` subclasses — `tryCatchAndThrowOnEngineError` only propagates `ENGINE` errors; a plain `Error` is silently swallowed as a user failure.
- USER-level errors (e.g. stale `{{connections.X}}`) must surface as a FAILED step, never `INTERNAL_ERROR` (which fails the worker job and pages oncall).
- Resolve action input INSIDE the executor's error wrapper (`piece-executor` is the reference); trigger step has no meaningful `input` — raw event/payload/result all live in `output`.

---

## 2. Pieces & Integrations
*Packaged integrations and the credentials that authenticate them.*

**Decision**
- **Pieces distributed as links** — every piece is one 307-redirect link to its `.tgz` (S3 / npm / file store); S3 copies warmed lazily on a cache miss.

**Domain** (`.agents/contexts/pieces`)
- **Piece** = npm-packaged integration (triggers/actions); **Piece Metadata** = registry entry.
- **App Connection** = stored credentials across 7 types (OAUTH2/CLOUD_OAUTH2/PLATFORM_OAUTH2/SECRET_TEXT/BASIC_AUTH/CUSTOM_AUTH/NO_AUTH); **Global Connection** = platform-shared; **OAuth App** = custom per-piece client creds.
- **externalId** = stable UUID cross-referencing across imports/templates/environments.
- **Piece Set** = include/exclude visibility config per project (`managePiecesEnabled`); the **Default Set** is undeletable.
- **Visibility Policy** = pure `resolveVisibility({platformId, projectId})`, enforced identically over HTTP and MCP (null = CE / no filtering).

**Piece SDK rules** (`packages/pieces`)
- After `create-piece`, add the path mapping to `tsconfig.base.json`; trigger `run()` MUST return an array; always give triggers `sampleData`.
- Use `httpClient` from `@activepieces/pieces-common`; three auth types (`SecretText`/`OAuth2`/`CustomAuth`) all support `validate`.
- Rich `run()` context: `store` (persists across runs), `run.stop/pause/respond`, `generateResumeUrl()`, `executionType` (BEGIN/RESUME), `agent.tools()`; i18n via identity-mapped `src/i18n/translation.json`.

---

## 3. Flows, Runs & Human Input
*What users build and what runs — the core automation model.*

**Decision**
- **Approval resume requires POST confirmation** — dedicated `/confirm` route; a GET never consumes the waitpoint, only the human POST does (defeats email-scanner prefetch).

**Domain — Automation Core** (`.agents/contexts/automation-core`)
- **Flow** = versioned trigger + action graph (JSONB); a **FlowVersion** is immutable once LOCKED (DRAFT editable, one draft per flow); **Published** = the LOCKED version at `publishedVersionId`.
- **Step** is a **Trigger** (POLLING/WEBHOOK/APP_WEBHOOK/MANUAL) or an **Action**; all 26 edit types flow through one `FlowOperationRequest` endpoint.
- **FlowRun** = one execution with a status state machine (QUEUED→RUNNING→PAUSED/SUCCEEDED/FAILED/TIMEOUT/CANCELED); **RunTimeline** splits latency into QUEUE/PROVISION/BOOT/RUN.
- **Agent** = a flow step running an autonomous LLM loop; **AgentTool** = Piece/Flow/MCP/Knowledge Base.
- **Sample Data** = captured step I/O (File per version) for testing downstream steps; **Resume Confirmation Page** = human-POST-to-resume page defeating scanner GET prefetch.

**Domain — Releases & Environments** (`.agents/contexts/releases`)
- **Project Release** = serialized project-state snapshot for promotion; **Release Plan** = computed diff before committing; **Git Sync** = bidirectional flow/table sync with a Git branch.

---

## 4. Webhooks, Events & Files
*Getting data in and out — inbound triggers, the event bus, and blob storage.*

**Decisions**
- **Async webhook ACK is Redis-durable** — 200 on enqueue to Redis, no Postgres on the ingest hot path; durability = Redis AOF persistence.
- **Streaming file writes relay through the app** — `ctx.files.write()` takes a `Readable`, app streams to storage via `lib-storage`; one path, presigned-multipart rejected as over-engineering.
- **Webhook files stream to S3, no buffering** — drop the global `attachFieldsToBody` + `fastify-raw-body` buffering; explicit `request.parts()`. Trade-off: multipart signature verification dropped.

**Domain — Eventing & Webhooks** (`.agents/contexts/eventing`)
- **Webhook** = inbound HTTP trigger (sync/async); **Handshake** = ownership verification before events flow.
- **Application Event** = internal-bus domain event (19 types); **Event Destination** = outbound webhook for platform/project events, delivered via BullMQ.

**Domain — Data & Storage** (`.agents/contexts/data-storage`)
- **Table** = built-in store with **Field** (TEXT/NUMBER/DATE/STATIC_DROPDOWN), **Record**, **Cell**; **TableWebhook** links table events to a flow.
- **File** = blob (S3 or DB) with type, optional compression, expiry; **Store Entry** = project-scoped key-value for pieces to persist across runs.
- **Knowledge Base** = document store that chunks files into vector embeddings for AI search.

---

## 5. Platform, Tenancy, Auth & AI
*The multi-tenant shell — who owns what, who can log in, and the AI layer.*

**Domain — Platform & Multi-tenancy** (`.agents/contexts/platform`)
- **Platform** owns projects/users/billing/branding; **Project** = workspace of flows/tables/connections/members. Hierarchy: Platform → Project → User.
- **PlatformPlan** = 40+ column feature-flag/quota/billing entity; **Edition** = CE/EE/Cloud; **License Key** activates self-hosted EE.
- **PlatformRole** (ADMIN/MEMBER/OPERATOR); **ProjectRole** = permission set (26 permissions; 3 defaults + custom).
- **API Key** = platform-scoped, hashed, `sk-` prefixed; **Custom Domain** = DNS-verified white-label; **Signing Key** = RSA-4096 for embedded Managed Auth JWTs.

**Domain — Authentication & Security** (`.agents/contexts/authentication`)
- **UserIdentity** = auth record; one identity maps to users across platforms; bumping **tokenVersion** invalidates all JWT sessions.
- **OTP** (10-min) for verification/reset; **Federated Auth** (Google/GitHub) vs **Managed Auth** (embedded token → AP session, auto-provisions); **SAML 2.0** + **SCIM 2.0** for enterprise.
- **RBAC** by ProjectRole; **Audit Event** = 19 persisted security-action types; **Secret Manager** = external vault (AWS/Vault/Conjur/1Password).

**Domain — AI & Intelligence** (`.agents/contexts/ai`)
- **AI Provider** = configured LLM backend (OpenAI/Anthropic/Google/Azure/OpenRouter/Cloudflare/Custom/Activepieces), encrypted creds.
- **AI Credits** = metered currency (1000 credits = $1), backed by OpenRouter key limits; **Platform Copilot** = RAG flow-building assistant.

**Domain — Infrastructure / Platform Services** (`.agents/contexts/infrastructure`)
- **Alert** = failure email (Redis dedup, 24h window); **MCP Server** = per-project endpoint exposing AP tools; **Template** = reusable flow blueprint; **User Invitation** = JWT invite (auto-accepted for existing users); **Badge** = gamification (9 types).

---

## 6. Code Conventions
*Cross-cutting `CLAUDE.md` rules that apply regardless of subsystem.*

**Repo-wide**
- ALL DB queries filter by `projectId`/`platformId`; new entities MUST be registered in `getEntities()` (no auto-discovery).
- EE extends CE via `hooksFactory`; never import `src/app/ee/` from CE; gate EE with `platformMustHaveFeatureEnabled`.
- Thin core packages (`core-utils`/`core-piece-types`/`core-formula`/`core-execution`) are bundleable and framework-agnostic; `@activepieces/shared` is the one thick member — pieces & engine may import the thin ones but **never** `@activepieces/shared`.
- Any change to `core/shared` needs a `package.json` version bump; exported types/consts go at the END of a file.
- HTTP mutations are POST/DELETE only; outbound HTTP in server api/worker/utils must use `safeHttp` (SSRF); primary-data queries set `meta: { showErrorDialog: true }`.

**Web** (`packages/web`)
- Tests live under `test/` mirroring `src/`; compose classNames with `cn()`; overflowing text uses `TextWithTooltip` (parent `min-w-0`).
- Dialog owns `open`; the form is a separate child reset via `key`, not `form.reset()`; always `zodResolver` + `defaultValues` + `mode: 'onChange'`; server errors → `root.serverError`.
- `useEffect` only for external-system sync — never for derived state, reinit-on-prop, or transforms.
- Queries behind a 402 feature gate MUST set `enabled: platform.plan.<flag>`; wrap plan-gated pages in `LockedFeatureGuard`.
- i18n is ICU MessageFormat: single-brace `{var}`, `{count, plural, ...}` with `#`/`=1`.

**Server** (`packages/server`)
- Reuse/extend endpoints before adding; each feature registers via a thin `*.module.ts` owning its route prefix.
- Array columns use `{ type: String, array: true, nullable: false }`; schema changes go through migrations, never bare entity edits.
- No N+1: JOIN / `IN (:...ids)` / SQL filtering, never query-per-item in a loop.
- **evlog**: fields grouped by entity with the entity's own `id` inside its group; errors use `error` not `err`; unit suffixes (`Ms`/`Bytes`/`Count`); never set reserved keys.
- Version gate is cwd-relative, returns `'0.0.0'` on read failure; `versionsAreCompatible()` is fail-closed (both-`'0.0.0'` = INCOMPATIBLE).

**Core packages**
- **core-shared** (`@activepieces/shared`): Zod schema + `z.infer` dual export; central registries live here — `Permission`, `ErrorCode` (also map HTTP in `error-handler.ts`), `ApFlagId`, `FlowOperationType`, `FlowRunStatus`, `WorkerJobType`, `ApplicationEventName`; export via feature barrel → `src/index.ts`.
- **core-formula**: the `{{ ... }}` evaluator, shared by engine (input resolution) and api/web (validation).
- **core-execution**: reserved STUB — engine still imports these types from `@activepieces/shared`; will sever engine from shared later.
- **core-utils / core-piece-types**: tier-1 foundation, `"sideEffects": false`, may import `@activepieces/core-*` only (lint-enforced) — bundled into every piece and the engine.
