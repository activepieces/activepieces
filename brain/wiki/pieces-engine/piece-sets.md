---
icon: 🗂️
---

# Piece Sets

A named, reusable piece/action/trigger visibility configuration a platform admin defines once and assigns to many projects. Visibility is **derived at read time** — nothing is written when a new piece or action is installed.

### Model
- **PieceSetConfig** — `{ pieces: PieceSelection, selectedActions: Record<piece, action[]>, selectedTriggers: Record<piece, trigger[]> }`.
- **PieceSelection** — `{ mode: 'include_all' | 'exclude_all', exceptions: string[] }`. `include_all` = everything present and future except exceptions (auto-includes new pieces); `exclude_all` = only exceptions, hiding future pieces.
- **Selected components** — a piece key present in `selectedActions`/`selectedTriggers` means "curated": only listed components visible, new ones stay hidden. Absent key = all visible incl. future.
- **hiddenCoreSteps** — optional `FlowActionType[]` hiding core steps (Code, Loop, Router) from the builder's step selector. Read through `isCoreStepVisible({ config, type })`. Absent and empty both mean nothing is hidden, so there is no third state to reason about.
- **Default Set** — one per platform (`isDefault`, `key: 'default'`); unassigned projects resolve to it. Can't be deleted; projects reassign to it rather than being removed.
- Shared pure resolvers `isPieceVisible` / `isComponentVisible` / `isCoreStepVisible` live in `core/shared/.../ee/piece-set/` (used by both server and web).

### Entities & services
- `piece_set` entity — `platformId` (CASCADE), `name`, `key` (embed handle, unique per platform, auto `kebabCase(name)-<random>`), `isDefault` (partial unique index), `config` jsonb. Projects reference it via `project.pieceSetId` (FK SET NULL).
- `pieceSetService` — CRUD + `getOrCreateDefaultPieceSet` (distributed lock), `getForProject` (the one place the Default-set fallback lives), `duplicate`, `assignProject(s)` / `removeProjectAssignment`. `update` runs `pieceSetConfig.applyUpdate` (declarative merge, never touches unreferenced component keys).
- Routes `/v1/piece-sets` (platformAdminOnly), plus `GET /v1/piece-sets/current?projectId=` (project-scoped, returns just the `PieceSetConfig`) which the builder uses to resolve its own set. Update uses **ComponentIntent**: `{ mode: 'all' }` resets a piece to all; `{ mode: 'selected', selected }` sets the allow-list (empty array = hide all).

### Gotchas
- **The admin UI and the filtering engine are gated on different things.** `pieceSetModule` puts `platformMustHaveFeatureEnabled(managePiecesEnabled)` on every `/v1/piece-sets` route, but `resolveVisibility` (the read-time filter in `piece-filtering-utils.ts`) checks **edition only** — `ENTERPRISE || CLOUD`. So on an EE platform with the flag *off*, admins can no longer read or edit sets, yet the sets they already saved keep filtering pieces. Only CE makes piece sets truly inert (there, filtering falls back to legacy project-plan allow/block lists). Any new client-side consumer that copies `enabled: platform.plan.managePiecesEnabled` inherits this split and will stop enforcing while the server keeps going.
- There is **no** install-time sync and no `onPieceCreated` hook — resolution is purely read-time. See ADR 0001 (visibility derived, not materialized).
- Embed auth: a v4 JWT carries a `pieceSet` key claim; legacy v2/v3 tokens carry `piecesTags` (only the first tag honored, resolved to `key = tag`, else Default). Enforcement (`applyProjectPieceAccess`) runs unconditionally, not gated by the flag.
- **Core steps are a separate list, not names in `pieces.exceptions`.** There is no `@activepieces/piece-code` — Code is `FlowActionType.CODE`, a client-side entry in `CORE_ACTIONS_METADATA` with no `piece_metadata` row, so `filterPieces` on the server can never match it. `hiddenCoreSteps` deliberately does **not** reuse `PieceSelection` either: that shape's `mode` exists to pre-decide the policy for pieces that do not exist yet, and core steps are a closed enum of three, so `exclude_all` would have no meaning and the admin UI could never set it. A bare array of what is hidden keeps absent and empty identical.
- **The admin toggle is a whole-set setting, not a table row.** It lives in the settings bar on the piece-set details page beside `Auto-include new pieces`, as a local `SettingToggle` (a bare `Switch` + label, with any explanation in an `Info` tooltip rather than inline text). An earlier attempt injected Code as a synthetic `PieceMetadataModelSummary` row in the pieces table and needed five `isCodeRow` special cases plus a fake package name; the setting is not per-piece, so the table was the wrong home.
- **Never hand `DataTable` exactly one row on its first render.** It sets page size from `initialState` (`virtualizeRows ? tableData.length || 1000 : …`), which React evaluates only once, and virtualized tables still run `getPaginationRowModel()`. Every table gets the `|| 1000` fallback purely because its first render has zero rows; prepend a single synthetic row up front and the page size is pinned to 1 forever, so the table renders that one row and nothing else. Applies to any table that injects a row, not just this one.
- **Piece sets filter the catalog, they do not authorize writes.** `resolveVisibility` is called only from `piece-metadata-service` (list + get). Nothing on the write path consults it: `flowService` does not validate step types or piece names against the set, and MCP `ap_add_step` accepts `FlowActionType.CODE` and any `pieceName` unchecked. So a hidden piece or a hidden Code step can still be added through the API, the MCP server, flow import, or copy/paste — hiding is a builder-UI affordance, not a policy. Flows that already contain one keep running and stay editable. Treat "turn Code off for compliance" requests as needing enforcement work, not just the visibility flag.
- **A client must never resolve its own set by id.** `project.pieceSetId` is nullable and unassigned projects fall back to Default **server-side**, so a client that reads by id silently ignores a Default-set setting. Never assume `pieceSetId` is populated because the migration backfilled it; projects created while `managePiecesEnabled` was off have none. That is what `GET /v1/piece-sets/current?projectId=` is for — it runs `pieceSetService.getForProject`, the same call `resolveVisibility` uses, and returns only the `PieceSetConfig` so the set's `name` and embed `key` never reach a project member. Every other route stays `platformAdminOnly`.
- **`/current` sits outside the feature gate on purpose.** `piece-set.module.ts` registers it first, then wraps the admin controller in a nested Fastify scope that owns the `managePiecesEnabled` preHandler. The module itself is registered only in the CLOUD and ENTERPRISE branches of `app.ts`, which *is* the edition check — so `/current` is reachable under exactly the conditions `resolveVisibility` filters pieces under. Its web consumer gates on `ApFlagId.EDITION`, not on `managePiecesEnabled`; copying the plan flag there would make core-step hiding stop while piece hiding kept going.
- Migration is three ordered steps: create table + backfill (`1807...`), then `CREATE INDEX CONCURRENTLY` (`1808...`, non-transactional), then the breaking drop of legacy platform piece-filter columns (`1809...`). Legacy `tag`/`piece_tag` tables are kept only because the backfill reads them once via raw SQL.

### Key files
Entry point: `pieceSetService`, defined in `piece-set.service.ts` and wired to the `/v1/piece-sets` routes by `piece-set.controller.ts`.

- `packages/server/api/src/app/ee/pieces/piece-set/` — entity, service, controller, module, and the `applyUpdate` config merge
- `packages/core/shared/src/lib/ee/piece-set/` — shared models, request DTOs, and the pure `isPieceVisible` / `isComponentVisible` resolvers
- `packages/server/api/src/app/ee/pieces/filters/piece-filtering-utils.ts` — applies the resolved set when filtering pieces and components
- `packages/server/api/src/app/ee/managed-authn/managed-authn-service.ts` — embed token enforcement via `applyProjectPieceAccess`
- `packages/server/api/src/app/ee/projects/ee-project-hooks.ts` — assigns the Default set on project `postCreate`
- `packages/web/src/features/piece-sets/` — client api and hooks
- `packages/web/src/app/routes/platform/setup/pieces/piece-sets/` — management UI, tabs and dialogs
- `brain/decisions/000007-piece-set-visibility-is-derived-at-read-time.md` — why visibility is derived rather than materialized

Paths verified 2026-07-17.
