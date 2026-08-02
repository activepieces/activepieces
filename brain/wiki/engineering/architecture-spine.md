---
icon: 🏛️
---

# Architecture Spine

Activepieces: open-source AI-first workflow automation platform (self-hosted or cloud, 400+ pieces, MCP support). Monorepo, Turbo (no Nx).

## Non-obvious architecture rules
- **Multi-tenant**: Platform → Projects → Users. ALL DB queries MUST filter by `projectId` or `platformId`. Connections with multi-project access use `ArrayContains([projectId])` on `projectIds`.
- **Editions**: CE / EE / Cloud via `AP_EDITION`; EE extends CE through the hooksFactory seam (the mechanic lives on Platform & Editions). **Never import `src/app/ee/` from CE code.**
- **Entity registration**: new TypeORM entity MUST be added to `getEntities()` in `database-connection.ts` + migration imported in `postgres-connection.ts` + added to `getMigrations()`. No auto-discovery.
- **HTTP**: POST for all create/update, DELETE for deletes. Never PUT/PATCH. Every endpoint needs `securityAccess`.
- **Side effects**: separated into `*-side-effects.ts`, called explicitly after mutations.
- **Multi-server concurrency**: `distributedLock`, BullMQ dedup, or `FOR UPDATE SKIP LOCKED`.
- **SSRF**: outbound HTTP in `server/{api,worker,utils}` must use `safeHttp.axios`/`createAxios` from `@activepieces/server-utils`. Never raw `fetch`/`axios.create` on user/OAuth/third-party URLs.
- **Self-hosting**: any new env var/secret/piece-auth/DB-extension must default to zero setup — never ship UI that looks enabled but is silently broken without manual setup.

## Core packages (thin → thick)
`packages/core/*` = `@activepieces/core-<name>` (utils, piece-types, formula, execution — thin, framework-agnostic, dual-format). **Exception**: `packages/core/shared` keeps the name `@activepieces/shared` (thick, app-level, carries DB/EE schemas + heavy deps). Pieces & engine may import the thin members but **never** `@activepieces/shared` — they get symbols via `@activepieces/pieces-framework`. Any change to `core/shared` needs a version bump in its package.json (patch=fix, minor=new export).

## Coding conventions
- No `any`, no `as` type casting, no `@deprecated` APIs.
- Go-style errors: `tryCatch`/`tryCatchSync` from `@activepieces/shared`.
- Named params (single destructured object), immutable data flow (return, don't mutate caller's collection).
- Zod messages must be i18n keys in `web/public/locales/en/translation.json`; use `formErrors` constant.
- File order: imports → exported fns/consts → helpers → types. **Exported types/consts at end of file.**
- Util files: group plain fns into one `export const myUtils = {...}`; React components stay named exports.
- i18next interpolation uses `{var}` not `{{var}}`.

## Verify
`npm run lint-dev` before done. `npm run test-unit` (vitest), `npm run test-api` (CE/EE/Cloud).

## Gotchas

**A barrel that re-exports a heavy module defeats bundle isolation — `sideEffects: false` and tree-shaking are not enough.** `@activepieces/core-agent-runtime` keeps its provider-SDK factory in `lib/model.ts` (seven `@ai-sdk/*` packages) so hosts that build their own model — the engine — don't pay for it. Splitting the loop's imports so it never referenced `model.ts` was **not** sufficient: as long as `src/index.ts` did `export * from './lib/model'`, esbuild still pulled every SDK into the engine bundle, because several `@ai-sdk/*` packages are not themselves marked side-effect-free. Measured on one branch, same build, only the barrel differing: **16 provider-SDK input files / 1,534,955 bytes → 3 files / 149,485 bytes**. The fix is structural, not a bundler flag — take the heavy module off the barrel and expose it as a subpath (`exports` + `main`), so the one consumer that needs it imports `@activepieces/core-agent-runtime/model` explicitly. This is what keeps `brain/decisions/000001`'s small worker image true. **Add `typesVersions` next to `exports`**: the repo builds with `moduleResolution: "node"`, which honours `exports` at runtime (Node does the resolving) but ignores it for types, so TS reports `TS2307 Cannot find module` on the subpath without it.

**`turbo run build` does not typecheck test files — a signature change can break a test at runtime with a green build.** Every package's `tsconfig.lib.json` has `"include": ["src/**/*.ts"]`, so anything under `test/` is invisible to the build. Renaming a parameter on an exported helper passed `tsc`, passed lint, and left `packages/server/worker/test/lib/chat-eval/core/runner.ts` calling it with the old shape — which would only have surfaced when the chat-eval gate ran, and that gate is `skipIf(!HAS_PROVIDER_KEY)`, so it is skipped by default. When you change an exported signature, grep `test/` for callers or run the package's vitest; the build will not tell you.

**Don't `.max()` a business limit on a request body — cap server-side.** A `.max()` on a request-body field rejects the *whole* request with a 400 the moment a user crosses it, so a user editing a list that reaches 50 items loses their entire save. Reserve `.max()` for a true trust-boundary DoS guard (Fastify's global body limit already covers gross abuse) and let business limits just *apply*: accept the input and `slice(0, MAX)` in the service layer, so the write always succeeds with the limit quietly enforced. Surfaced 2026-07 on `POST /v1/chat/memory`, where the schema's `.max(50)`/`.max(280)` duplicated a `slice` the save helper already did — redundant *and* a data-loss bug.

**TypeORM soft-delete (`@DeleteDateColumn`) is not canary/rollback-safe on a shared DB.** TypeORM only appends `WHERE "deleted" IS NULL` for code whose entity *declares* the column, so any two versions sharing one Postgres — every canary window (canary shares prod's DB), every rollback — means old code reads soft-deleted rows as live. During canary a row deleted by new code reappears live and editable on old-code requests; on rollback every soft-deleted row returns permanently. Partially unrecoverable, too: old code's delete is a hard `DELETE`, so it can destroy a resurrected row the new restore feature could otherwise bring back. Partial indexes (`WHERE deleted IS NULL`) also stop serving old queries → seq scans. Do it expand-contract: ship the column and make **all** read paths filter on it first, roll that out everywhere, and only then flip the write path to `softDelete()`. The additive column is fine — it's the read-semantics change that can't run split across versions, and the same applies to any migration where old code must interpret a column it doesn't know about. Seen in PR #14219 (feat: chat core).

**Canary doesn't proxy websockets — only broadcasts reach canary users.** Canary is a worker group that *also* has its own app tier (`CANARY_APP_URL`, `IS_CANARY_APP`), sharing prod's Postgres and Redis. The prod app is the ingress and `canaryRoutingMiddleware` HTTP-proxies a platform whose `workerGroupId === 'canary'` to the canary app — but the middleware is registered inside the `/api` scope, so only `/api/*` is proxied (the SPA is served at root from the baked-in bundle) and it bails on upgrades: `if (request.headers.upgrade === 'websocket') return`. A canary platform therefore runs the **prod** frontend, and its websocket is terminated by **prod (old code)** while its HTTP and flow jobs run on canary. Across a version split, server→client broadcasts still work (socket.io's Redis adapter relays canary's `emit` name-agnostically), but inbound handlers — `LOCK_RESOURCE`/`UNLOCK_RESOURCE`, presence — run on old prod code and silently degrade. The fix, verified 2026-07: point canary-platform websockets at the already-live `canary.activepieces.com` by making the frontend socket URL a runtime value from an authenticated `/api` flag (that call *is* proxied, so canary answers `wss://canary.activepieces.com` and prod answers same-origin) and deferring socket creation until it resolves. Cross-origin is fine (`cors:{origin:'*'}`, token in `socket.auth`, not cookies), and it closes the inbound half of the seam too. kamal-proxy can't help — host/path routing only, no cookie/header routing — and `reply.from` is HTTP-only. Canary is the only worker group with a separate app tier; dedicated groups share the prod app, so their users' websockets already hit the right code. Workers are the mirror case: they carry `workerGroupId` in post-upgrade auth but use an explicit `socketUrl`, so canary workers must point at the canary app by config.
