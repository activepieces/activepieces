---
icon: 🔒
---

# Variables

Project-scoped, encrypted secret values (API keys, tokens) users create once and reference in any flow input via `{{variables['NAME']}}`. Stored in a dedicated `variable` table, fully separate from `app_connection`. Ships in every edition (no plan flag).

### Entities & services
- **Variable**: unique `(projectId, name)`. `name` is immutable, regex `^[a-zA-Z0-9_]+$`, used as both label and mention key. `value` stored as `EncryptedObject` (`{iv,data}`) wrapping `{secret_text}`.
- `variable.service.ts` (create/update/list/owners/delete, decrypt for reveal and for the worker); `variable-worker.controller.ts` is the engine-only route.
- Encryption: `encryptUtils.encryptObject` (AES-256-CBC) on write; decrypted on reveal and worker fetch.

### How it works
- User routes `/v1/variables`: `POST /` creates (an existing name returns 409 `VALIDATION` "Variable name already used"), `POST /:id` rotates the value, `GET /` lists (`name` filter is a contains match), `GET /owners`, `DELETE /:id`. API keys (SERVICE) may use all of these. Reveal is `POST /:id/reveal`, **USER-only** (an API key gets 403).
- Engine resolves mentions via `GET /v1/worker/variables/:name` using the engine principal token. `resolveSingleToken` checks `variables` prefix first, then `connections`, then step refs. Mention always resolves to a string (no sub-field access).
- Permissions: `READ_VARIABLE` (VIEWER+), `WRITE_VARIABLE` (EDITOR/ADMIN, needed for create/rotate/delete/reveal).

### Gotchas
- The create/rotate dialog value field is deliberately **NOT** `type="password"` (Chrome's leaked-password breach check + password-manager prompt, GIT-1619). It's `type="text"` masked with CSS `-webkit-text-security: disc`, `autoComplete="off"`, `spellCheck={false}`. Firefox < 118 renders unmasked (acceptable — only holds text being typed).
- Every reveal fires `VARIABLE_VALUE_REVEALED` (audit event `variable.value.revealed`) — use it for "who pulled variable X and when". Also `VARIABLE_UPSERTED`, `VARIABLE_DELETED`.
- The engine ignores anything after the key in a `variables` token: `{{ variables['X'] || 'fallback' }}` goes to `parseVariableName`, never the script evaluator, so the fallback never runs and a missing variable still fails the step. Step tokens do evaluate `||`. The builder chip shows such tokens as the raw expression so the dropped part stays visible (GIT-1768).
- The run log stores the censored step input, so a `variables` token shows as `**REDACTED**`. The step **output** is not censored: a step that returns the value stores it in plain text.
- Deleting a variable leaves the flows that use it. Their next run fails the step with `variable (NAME) not found`, a USER error (FAILED run, no retry).
- The owner filter of `/variables` runs in the browser on the current page only (ENG-553). A table test that seeds every row as one user cannot catch it.
- E2E specs of this feature carry the tag `@feature:variables`.

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

Paths verified 2026-11-16.
