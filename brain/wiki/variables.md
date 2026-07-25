---
icon: 🔒
---

# Variables

Project-scoped, encrypted secret values (API keys, tokens) users create once and reference in any flow input via `{{variables['NAME']}}`. Stored in a dedicated `variable` table, fully separate from `app_connection`. Ships in every edition (no plan flag).

### Entities & services
- **Variable**: unique `(projectId, name)`. `name` is immutable, regex `^[a-zA-Z0-9_]+$`, used as both label and mention key. `value` stored as `EncryptedObject` (`{iv,data}`) wrapping `{secret_text}`.
- `variable.service.ts` (upsert/list/delete/reveal/decrypt-for-worker); `variable-worker.controller.ts` is the engine-only route.
- Encryption: `encryptUtils.encryptObject` (AES-256-CBC) on write; decrypted on reveal and worker fetch.

### How it works
- User routes `/v1/variables`: POST upsert, GET list, DELETE. Reveal is `POST /:id/reveal`, **USER-only** (no SERVICE keys).
- Engine resolves mentions via `GET /v1/worker/variables/:name` using the engine principal token. `resolveSingleToken` checks `variables` prefix first, then `connections`, then step refs. Mention always resolves to a string (no sub-field access).
- Permissions: `READ_VARIABLE` (VIEWER+), `WRITE_VARIABLE` (EDITOR/ADMIN, needed for create/rotate/delete/reveal).

### Gotchas
- The create/rotate dialog value field is deliberately **NOT** `type="password"` (Chrome's leaked-password breach check + password-manager prompt, GIT-1619). It's `type="text"` masked with CSS `-webkit-text-security: disc`, `autoComplete="off"`, `spellCheck={false}`. Firefox < 118 renders unmasked (acceptable — only holds text being typed).
- Every reveal fires `VARIABLE_VALUE_REVEALED` (audit event `variable.value.revealed`) — use it for "who pulled variable X and when". Also `VARIABLE_UPSERTED`, `VARIABLE_DELETED`.

### Key files
Entry point: `variableModule`, registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/variable/` — entity, service, REST + worker controllers, Fastify module
- `packages/server/api/src/app/database/migration/postgres/1793000000000-AddVariableTable.ts` — schema migration
- `packages/server/engine/src/lib/piece-context/variable-resolver.ts` — engine-side resolver, mirrors `connection-resolver.ts`
- `packages/server/engine/src/lib/variables/props-resolver.ts` — the `variables` branch of `resolveSingleToken`
- `packages/core/shared/src/lib/automation/variable/` — `Variable` types, name regex, upsert/read request DTOs
- `packages/web/src/features/variables/` — frontend client + TanStack Query hooks
- `packages/web/src/app/routes/variables/` — the `/variables` list page
- `packages/web/src/app/variables/` — create / rotate dialog, reused by the page and the data-selector tab
- `packages/web/src/app/builder/data-selector/variables-tab.tsx` — builder panel for inserting mentions

Paths verified 2026-07-17.
