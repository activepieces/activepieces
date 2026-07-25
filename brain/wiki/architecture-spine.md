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
