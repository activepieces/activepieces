---
icon: 🗂️
---

# Piece Sets

A named, reusable piece/action/trigger visibility configuration a platform admin defines once and assigns to many projects. Visibility is **derived at read time** — nothing is written when a new piece or action is installed.

### Model
- **PieceSetConfig** — `{ pieces: PieceSelection, selectedActions: Record<piece, action[]>, selectedTriggers: Record<piece, trigger[]> }`.
- **PieceSelection** — `{ mode: 'include_all' | 'exclude_all', exceptions: string[] }`. `include_all` = everything present and future except exceptions (auto-includes new pieces); `exclude_all` = only exceptions, hiding future pieces.
- **Selected components** — a piece key present in `selectedActions`/`selectedTriggers` means "curated": only listed components visible, new ones stay hidden. Absent key = all visible incl. future.
- **Default Set** — one per platform (`isDefault`, `key: 'default'`); unassigned projects resolve to it. Can't be deleted; projects reassign to it rather than being removed.
- Shared pure resolvers `isPieceVisible` / `isComponentVisible` live in `core/shared/.../ee/piece-set/` (used by both server and web).

### Entities & services
- `piece_set` entity — `platformId` (CASCADE), `name`, `key` (embed handle, unique per platform, auto `kebabCase(name)-<random>`), `isDefault` (partial unique index), `config` jsonb. Projects reference it via `project.pieceSetId` (FK SET NULL).
- `pieceSetService` — CRUD + `getOrCreateDefaultPieceSet` (distributed lock), `duplicate`, `assignProject(s)` / `removeProjectAssignment`. `update` runs `pieceSetConfig.applyUpdate` (declarative merge, never touches unreferenced component keys).
- Routes `/v1/piece-sets` (platformAdminOnly). Update uses **ComponentIntent**: `{ mode: 'all' }` resets a piece to all; `{ mode: 'selected', selected }` sets the allow-list (empty array = hide all).

### Gotchas
- EE/Cloud only, gated behind `platform.plan.managePiecesEnabled`. On CE / flag off, piece sets are inert and filtering falls back to legacy project-plan allow/block lists.
- There is **no** install-time sync and no `onPieceCreated` hook — resolution is purely read-time. See ADR 0001 (visibility derived, not materialized).
- Embed auth: a v4 JWT carries a `pieceSet` key claim; legacy v2/v3 tokens carry `piecesTags` (only the first tag honored, resolved to `key = tag`, else Default). Enforcement (`applyProjectPieceAccess`) runs unconditionally, not gated by the flag.
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
