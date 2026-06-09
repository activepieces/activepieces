# Variables

## Summary
Variables are project-scoped, encrypted secret values (API keys, tokens, opaque strings) that users create once and reference inside any flow input via a mention syntax `{{variables['NAME']}}`. They live in a dedicated `variable` table — completely separate from `app_connection` — and resolve at flow execution time through a worker endpoint the engine calls. Values are encrypted at rest with `encryptUtils.encryptObject`; the plaintext is only available to USER principals via the explicit reveal endpoint (audit-logged) or to the engine during a flow run.

## Key Files
- `packages/server/api/src/app/variable/variable.entity.ts` — TypeORM entity (`variable` table, unique `(projectId, name)` index, SET NULL FK to user).
- `packages/server/api/src/app/variable/variable.service.ts` — upsert / list / delete / reveal / decrypt-for-worker.
- `packages/server/api/src/app/variable/variable.controller.ts` — `/v1/variables` REST routes (USER + SERVICE).
- `packages/server/api/src/app/variable/variable-worker.controller.ts` — `/v1/worker/variables/:name` engine-only route.
- `packages/server/api/src/app/variable/variable.module.ts` — Fastify module wrapper.
- `packages/server/api/src/app/database/migration/postgres/1793000000000-AddVariableTable.ts` — schema migration.
- `packages/server/engine/src/lib/piece-context/variable-resolver.ts` — engine-side resolver, mirrors `connection-resolver.ts`.
- `packages/server/engine/src/lib/variables/props-resolver.ts` — adds the `variables` branch to `resolveSingleToken`.
- `packages/shared/src/lib/automation/variable/variable.ts` — `Variable`, `VariableWithoutSensitiveData`, `VARIABLE_NAME_REGEX`.
- `packages/shared/src/lib/automation/variable/dto/{upsert,read}-variable-request.ts` — request schemas.
- `packages/web/src/features/variables/{api/variables.ts,hooks/variables-hooks.ts}` — frontend client + TanStack Query hooks.
- `packages/web/src/app/routes/variables/index.tsx` — `/variables` list page.
- `packages/web/src/app/variables/variable-dialog.tsx` — create / rotate dialog (reused by the page and the data-selector tab).
- `packages/web/src/app/builder/data-selector/variables-tab.tsx` — builder side panel for inserting `variables['NAME']` mentions.

## Edition Availability
- Community (CE): available.
- Enterprise (EE): available.
- Cloud: available.

No plan flag — the feature ships in every edition.

## Permissions
- `READ_VARIABLE` — list page, copy-reference, data-selector tab, mention resolution. Granted to VIEWER, EDITOR, ADMIN.
- `WRITE_VARIABLE` — create / rotate / delete / reveal value. Granted to EDITOR and ADMIN; VIEWER cannot mutate.
- The reveal endpoint additionally restricts the principal to `USER` (no SERVICE keys) and emits `VARIABLE_VALUE_REVEALED` on every hit so admins can audit who pulled which secret and when.

## Domain Terms
- **Variable**: an encrypted project-scoped secret keyed by a project-unique `name`.
- **name**: stable identifier (alphanumeric + underscore, regex `^[a-zA-Z0-9_]+$`); used both as the display label and the mention key. Immutable after create.
- **value**: opaque secret. Stored as `EncryptedObject` (`{ iv, data }`) wrapping `{ secret_text }`.
- **Mention syntax**: `{{variables['NAME']}}`. Resolved by the engine at execution time to the plaintext value.

## Entity

**Variable**: id, created, updated, name, projectId, platformId, ownerId (nullable FK), value (EncryptedObject jsonb), metadata (jsonb, nullable). Unique index on `(projectId, name)`; index on `ownerId`.

## Endpoints

All mount under `/v1/variables`. Project-scoped via the body / query / `:id` lookup.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| POST | `/v1/variables` | USER + SERVICE | `WRITE_VARIABLE` | Upsert by `(projectId, name)`. Fires `VARIABLE_UPSERTED`. |
| GET | `/v1/variables` | USER + SERVICE | `READ_VARIABLE` | Paginated list. Filters by `name` substring. |
| POST | `/v1/variables/:id/reveal` | USER only | `WRITE_VARIABLE` | Returns `{ value }`. Fires `VARIABLE_VALUE_REVEALED`. |
| DELETE | `/v1/variables/:id` | USER + SERVICE | `WRITE_VARIABLE` | Hard delete. Fires `VARIABLE_DELETED`. |

Worker route (engine-only, via engine principal token):

| Method | Path | Description |
|---|---|---|
| GET | `/v1/worker/variables/:name` | Returns the decrypted `{ value }` for the project carried in the engine principal. Called by the engine while resolving `{{variables['NAME']}}` mentions. |

## Engine Resolution

When the input contains an `ap-formula-v1::{...}` wrapper, `resolveInputAsync` routes the input through the formula evaluator first; the evaluator's `preResolveFormulaVars` calls back into the same `resolveSingleToken` path described below for each `{{var}}` it finds inside the expression. See `formula.md` for the wrapper format and pipeline.

The engine's `resolveSingleToken` checks for the `variables` prefix first, then `connections`, then evaluates the token as a regular step reference. The `variables` branch:

1. Parses the name out of `variables['NAME']` (bracket form) or `variables.NAME` (dot form).
2. If `censoredInput` (used to build the redacted copy of the resolved input), returns `**REDACTED**`.
3. Otherwise calls `createVariableResolver({ engineToken, projectId, apiUrl }).obtain(name)`, which fetches `/v1/worker/variables/:name` with the engine principal token.
4. Returns the plaintext string. The mention always resolves to a `string`; there is no sub-field access (`.secret_text` is implicit).

## Encryption

`encryptUtils.encryptObject` (AES-256-CBC) on write. `encryptUtils.decryptObject<{ secret_text: string }>` on reveal and worker fetch.

## Frontend

The `/variables` page mirrors the connections page visually: an info Alert above a TanStack Data Table with search, owner column, bulk delete, and a per-row dropdown (`Edit` / `Copy reference` / `Copy value` / `Delete`). `Copy reference` writes `{{variables['NAME']}}` to the clipboard and is always enabled — copy and edit operations that need the plaintext (`Copy value`, `Edit`) require `WRITE_VARIABLE`. The builder data-selector exposes a "Variables" tab next to "Data"; inserting a row emits a mention chip that renders `Variable · <name>` with a key SVG icon.

## Audit Events

- `VARIABLE_UPSERTED` — `variable.upserted`. Fired on create or rotate.
- `VARIABLE_DELETED` — `variable.deleted`. Fired on hard delete.
- `VARIABLE_VALUE_REVEALED` — `variable.value.revealed`. Fired on every successful reveal (UI "Copy value" or direct API call). Use this to answer *"who pulled variable X and when"*.
