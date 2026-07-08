# Piece Sets

## Summary
A **piece set** is a named, reusable piece/action/trigger visibility configuration that a platform admin defines once and assigns to many projects. Its `config` is an **include/exclude selection**: a piece-level `{ mode, exceptions }` plus per-piece action/trigger allow-lists (`selectedActions` / `selectedTriggers`). Visibility is **derived at read time** — nothing is written when a new piece/action is installed. Every platform has exactly one **Default** set; a project without an explicit assignment resolves to it. Piece sets replace the older per-project piece filtering (project plan allow/block lists) when `platform.plan.managePiecesEnabled` is on — see [pieces.md](./pieces.md). See ADR `.agents/contexts/pieces/docs/adr/0001-piece-set-visibility-derived-at-read.md` for why the model is derived rather than materialized.

## Key Files
- `packages/core/shared/src/lib/ee/piece-set/index.ts` — `PieceSet` / `PieceSetConfig` / `PieceSelection` / `ComponentIntent` models + request DTOs, and the pure resolvers `isPieceVisible` / `isComponentVisible` (imported by both server and web)
- `packages/server/api/src/app/ee/pieces/piece-set/piece-set.entity.ts` — `piece_set` TypeORM entity
- `packages/server/api/src/app/ee/pieces/piece-set/piece-set.service.ts` — CRUD, default-set creation, project assignment
- `packages/server/api/src/app/ee/pieces/piece-set/piece-set-config.ts` — `buildDefaultSet`, `emptyConfig`, and `applyUpdate` (declarative merge)
- `packages/server/api/src/app/ee/pieces/piece-set/piece-set.controller.ts` — routes under `/v1/piece-sets`
- `packages/server/api/src/app/ee/pieces/filters/piece-filtering-utils.ts` — applies the resolved set when filtering pieces/components (via the shared resolvers)
- `packages/web/src/features/piece-sets/` + `packages/web/src/app/routes/platform/setup/pieces/piece-sets/` — management UI

## Edition Availability
EE / Cloud only, gated behind `platform.plan.managePiecesEnabled`. On CE (or when the flag is off) piece sets are inert and piece filtering falls back to the legacy project-plan allow/block lists. No-op and zero-setup for self-hosted Community.

## Domain Terms
- **Piece Set** — named, reusable visibility config assignable to many projects
- **Default Set** — the per-platform set (`isDefault: true`, `key: 'default'`) that unassigned projects resolve to; cannot be deleted, and projects cannot be removed from it (they reassign to it)
- **PieceSetConfig** — `{ pieces: PieceSelection, selectedActions: Record<piece, action[]>, selectedTriggers: Record<piece, trigger[]> }`
- **PieceSelection** — `{ mode: 'include_all' | 'exclude_all', exceptions: string[] }`. `include_all` shows everything (present + future) except `exceptions` (the "auto-include new pieces" policy); `exclude_all` shows only `exceptions`, hiding future pieces
- **Selected components** — presence of a piece key in `selectedActions`/`selectedTriggers` means the piece is "curated": only the listed components are visible and new ones stay hidden. Absent key ⇒ all components visible incl. future
- **generatedForProjectId** — non-null for per-project sets created by the backfill migration for legacy `PiecesFilterType.ALLOWED` projects

## Entity (`piece_set`)
| Column | Type | Notes |
|---|---|---|
| id / created / updated | base | `BaseColumnSchemaPart` |
| platformId | ApId | owner; CASCADE on platform delete |
| name | string | |
| key | string (nullable) | embed-facing handle (referenced by the v4 token's `pieceSet` claim); unique per platform when set. Auto-generated as `kebabCase(name)-<random>` on create when not supplied. For tag-derived sets this is the tag name |
| isDefault | boolean | one per platform (partial unique index) |
| generatedForProjectId | ApId (nullable) | set when auto-generated per project by the backfill |
| config | jsonb | `PieceSetConfig` |

Indexes: `(platformId)`; unique partial `(platformId) WHERE isDefault`; unique partial `(platformId, key) WHERE key IS NOT NULL`. Projects reference a set via `project.pieceSetId` (FK `SET NULL`).

## Endpoints (`/v1/piece-sets`, platformAdminOnly: USER + SERVICE)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List sets for the platform (cursor paginated) |
| POST | `/` | Create a set (starts fully permissive: `pieces.mode = include_all`); `key` is optional and auto-generated from `name` when omitted |
| GET | `/:id` | Get a set |
| POST | `/:id` | Update name/key + declaratively patch config: `pieces` (full replace), `actions`/`triggers` as per-piece `ComponentIntent` |
| DELETE | `/:id` | Delete (Default protected); reassigns its projects to Default |
| POST | `/:id/duplicate` | Clone config under a new name |
| POST | `/:id/projects` | Assign one or more projects to the set |
| DELETE | `/:id/projects/:projectId` | Reassign a project back to Default |

**ComponentIntent** (request only): `{ mode: 'all' }` deletes the piece's selection key (reset to all); `{ mode: 'selected', selected: string[] }` sets the visible allow-list (empty array = hide all of that piece's components). Referenced keys are merged; unreferenced pieces are untouched.

## Service Methods (`pieceSetService`)
- `getOrCreateDefaultPieceSet(platformId)` — returns the Default set, creating it under a distributed lock if missing
- `list / getOne / create / update / delete / duplicate` — standard CRUD; `update` runs `pieceSetConfig.applyUpdate` (declarative merge), never touching unreferenced component keys
- `assignProject / assignProjects / removeProjectAssignment` — write `project.pieceSetId`; removal falls back to Default

There is **no** install-time sync method. New pieces/actions are handled purely by read-time resolution (`isPieceVisible` / `isComponentVisible`); there is no `pieceHooks.onPieceCreated`.

## Integration Notes
- **Project creation** (`ee-project-hooks.ts`): new EE projects are assigned the Default set on `postCreate` when `managePiecesEnabled`.
- **Managed auth** (`managed-authn-service.ts`): `applyProjectPieceAccess` runs unconditionally (not gated by `managePiecesEnabled` — that flag gates the management endpoints and the postCreate default-set assignment, not this enforcement path). A **v4** embed JWT carries a `pieceSet` key claim; legacy v2/v3 tokens carry `piecesTags` instead. Only the **first** tag is honored and resolved to the named set with `key = tag`; if no such set exists, the project falls back to Default. New integrations should use the v4 `pieceSet` claim. See [managed-auth.md](./managed-auth.md).
- **Migration**: a single `1807000000000-CreatePieceSetTable` creates the table + `project.pieceSetId`, backfills Default/tag/ALLOWED-project sets from legacy filtering (allow-lists map straight to `exclude_all` exceptions — no catalog inversion), and finally drops the superseded platform-level piece-filter columns (`filteredPieceNames`/`filteredPieceBehavior`).
- **Legacy piece tags**: the piece-tags *feature code* (entities/services/controller/UI under `pieces/tags/`) has been removed — piece sets superseded it. The `tag`/`piece_tag` tables are intentionally kept: they are created by the older `1712107871405-AddPieceTags` migration and read **once** (via raw SQL) by the `1807000000000-CreatePieceSetTable` backfill above. Nothing else reads or writes them at runtime.
