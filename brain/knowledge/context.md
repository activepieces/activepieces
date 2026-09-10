# Context

Activepieces is an open-source, AI-first workflow automation platform — an extensible replacement for Zapier — run either as self-hosted software or as our Cloud. It is built for the people automating their own work (technical and not) and for the platforms that white-label and embed it.

## Vocabulary

**Piece** — an integration package (`@activepieces/piece-*`) declaring its auth plus a set of actions and triggers. It is both an npm-shaped bundle the engine installs and a `piece_metadata` row the catalog serves.

**Flow** — a versioned directed graph of one trigger and its actions, stored as JSONB. Every one of the 26 ways to modify it goes through the single `POST /v1/flows/:id` endpoint.

**Flow Version** — a snapshot of a flow's graph. `DRAFT` is the editable copy edits land on; `LOCKED` is immutable and is what published runs execute.

**Trigger** — the definition of how a flow starts, realised as a `TriggerSource` row. Four strategies: POLLING, WEBHOOK, APP_WEBHOOK, MANUAL.

**Action Run** — a single piece action or code step executed on its own, synchronously, outside any flow. The unit behind MCP `ap_run_action` and the chat tools.

**Connection** — an encrypted credential record (AES-256) a step uses to call an external service, in one of eight auth shapes (`OAUTH2`, `SECRET_TEXT`, `CUSTOM_AUTH`, …). Scoped `PROJECT` or `PLATFORM`, and referenced from flows by a stable `externalId`.
_Avoid_: "app connection" in prose — that is the entity name, not the word we speak.

**Platform** — the top-level tenant namespace: branding, auth config, plan, and the projects under it. Every install has at least one.

**Project** — the workspace inside a platform that owns flows, connections and tables. `PERSONAL` (auto-created per user) or `TEAM`.

**Edition** — which build of the product is running, set by `AP_EDITION`: `ce` (Community), `ee` (self-hosted Enterprise), `cloud`. EE extends CE by injecting hooks, never by CE importing EE.

**Engine** — the bundled runtime that actually executes a flow or a step. It runs as a child process inside the sandbox and posts its own run-time callbacks straight to the app over HTTP.

**Worker** — the container that polls jobs off the queue, resolves them, and runs them. It is both the deployment unit and the execution unit, and it holds the only `apiClient`.

**Sandbox** — the in-process execution box the worker hands a fully-resolved job to. It materializes inputs to disk, runs exactly one engine operation, and returns the result; it has no connection back to the app.
_Avoid_: "pool" — the old sandbox-pool server is gone; parallelism at the destination is worker replicas.

**Resolver** — the worker-side step that turns a queued job into materialized box inputs: it resolves the flow version and piece metadata and hands back a ready **Flow Bundle**. It always runs before execution, so the sandbox only ever sees complete, compiled inputs.

**Flow Bundle** — the per-locked-flow-version artifact in S3/DB: a frozen manifest of piece versions plus the compiled code. The sandbox only ever consumes one that is already built.

**Piece Bundle** — the installable `.tgz` for one `name@version`, addressed as a link and resolved lazily in source order (own S3 bucket → Activepieces CDN → npm).

**Piece Set** — a named, reusable piece/action/trigger visibility configuration a platform admin assigns to projects. Visibility is derived at read time, so a newly installed piece needs no backfill.

**Agent** — a flow step that runs an autonomous LLM loop instead of a single call, over tools that are handles to Pieces, Flows, MCP servers, or a Knowledge Base.

**AI Credits** — the metered currency for AI usage, 1000 credits = $1. A quota, not a wallet.
_Avoid_: "tokens" for the billing unit — tokens are the model's unit, credits are ours.

**MCP Server** — the per-project endpoint that exposes Activepieces tools to an outside AI assistant. Distinct from a piece that *calls* somebody else's MCP server.

**Formula** — a user-authored data transform written in a builder text input via the `/` editor, saved inline as `ap-formula-v1::{…}::ap-formula-v1` so it round-trips through flow JSON. Evaluated synchronously in the engine, on every edition.

## Key files

- `packages/server/api/src/app/` — the Fastify app: every module, controller and service. Entry point: `app.ts`, which holds the edition switch.
- `packages/server/api/src/app/ee/` — every commercial module, registered only for `ee`/`cloud`. CE reaches it only through `hooksFactory` (`app/helper/hooks-factory.ts`).
- `packages/server/api/src/app/database/` — TypeORM wiring and migrations. Entry point: `getEntities()` in `database-connection.ts`.
- `packages/server/worker/` — the poll loop, worker groups and job dispatch. Entry point: `worker` in `src/lib/worker.ts`.
- `packages/server/sandbox/` — resolution, caching and the execution box. Entry points: `createResolver()` and `createSandboxRuntime()`.
- `packages/server/engine/` — the runtime that executes steps; one file per operation under `src/lib/operations/`.
- `packages/pieces/framework/` — the type-safe piece SDK. Entry points: `createPiece()`, `createAction()`, `createTrigger()`.
- `packages/pieces/community/` — the ~730 third-party integrations. `packages/pieces/core/` holds the first-party ones (http, forms, tables, subflows, schedule…).
- `packages/core/shared/` — `@activepieces/shared`: DB/EE schemas and the shared helpers. Thin, bundleable siblings live in `packages/core/{utils,piece-types,formula,execution}` — pieces and the engine may import those, never `shared`.
- `packages/web/src/features/` — the React app, one folder per feature; the builder canvas lives here.

## Gotchas

- **A new entity is invisible until you register it.** TypeORM does not auto-discover: add it to `getEntities()` in `packages/server/api/src/app/database/database-connection.ts` or it silently does not exist at runtime.
- **CE code must never import `src/app/ee/`.** CE declares a hook interface via `hooksFactory.create<T>(ceDefault)` and EE calls `.set(eeImpl)` in the `app.ts` edition switch. An import across that seam builds fine and breaks the Community build.
- **Connection queries filter on the `projectIds[]` array, not a scalar `projectId`.** Use `ArrayContains([projectId])` (or `scope = PLATFORM` for shared ones). A scalar filter compiles and quietly returns nothing.
- **Deleting a connection does not cascade to the flows using it.** They keep their reference and fail at runtime instead of at delete time.
- **A wrong Flow Bundle is sticky forever.** The manifest is only invalidated on a schema-version change, so a bundle published by buggy worker code keeps being served for that locked flow version and fixing the resolver does not heal it — delete the `FLOW_BUNDLE` file row plus its S3 object, or republish the flow. See decision 000005.
- **Nothing typechecks the engine.** `@activepieces/engine` builds with esbuild (types stripped) and lints with eslint only — there is no `tsc --noEmit` in CI, so type errors ship. Run tsc yourself and diff the error list against `main`; a green run is not the baseline.
