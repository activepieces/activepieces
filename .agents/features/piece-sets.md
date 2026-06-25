# Piece Sets

## Summary
A **piece set** is a named, reusable collection of piece / action / trigger visibility rules that a platform admin defines once and assigns to many projects. Each set carries a `config` of `disabledPieces`, `disabledActions` and `disabledTriggers`, plus `includeNewPieces` / `includeNewActions` flags that decide how newly installed pieces and actions are treated. Every platform has exactly one **Default** set; a project without an explicit assignment resolves to it. Piece sets replace the older per-project piece filtering (project plan allow/block lists) when `platform.plan.managePiecesEnabled` is on — see [pieces.md](./pieces.md) for how filtering routes between the two.

## Key Files
- `packages/core/shared/src/lib/ee/piece-set/index.ts` — `PieceSet` / `PieceSetConfig` models + request DTOs (create / update / duplicate / assign-projects / list)
- `packages/server/api/src/app/ee/pieces/piece-set/piece-set.entity.ts` — `piece_set` TypeORM entity
- `packages/server/api/src/app/ee/pieces/piece-set/piece-set.service.ts` — CRUD, default-set creation, config patching, project assignment, new-piece sync
- `packages/server/api/src/app/ee/pieces/piece-set/piece-set.controller.ts` — routes under `/v1/piece-sets`
- `packages/server/api/src/app/ee/pieces/piece-set/piece-set.module.ts` — registers the controller, gated by `managePiecesEnabled`
- `packages/server/api/src/app/ee/pieces/filters/piece-filtering-utils.ts` — applies the resolved set when filtering pieces/components
- `packages/server/api/src/app/ee/pieces/piece-hooks.ts` / `ee-piece-hooks.ts` — keep sets in sync when pieces/actions are installed
- `packages/web/src/features/piece-sets/` — `pieceSetsApi`, `pieceSetsHooks`
- `packages/web/src/app/routes/platform/setup/pieces/piece-sets/` — management UI (list, create/edit/duplicate dialogs, details page, pieces & projects tabs)

## Edition Availability
EE / Cloud only, gated behind `platform.plan.managePiecesEnabled`. On CE (or when the flag is off) piece sets are inert and piece filtering falls back to the legacy project-plan allow/block lists. No-op and zero-setup for self-hosted Community.

## Domain Terms
- **Piece Set** — named, reusable visibility config assignable to many projects
- **Default Set** — the per-platform set (`isDefault: true`, `externalId: 'default'`) that unassigned projects resolve to; cannot be deleted, and projects cannot be removed from it (they reassign to it)
- **PieceSetConfig** — `{ disabledPieces: string[], disabledActions: Record<piece, action[]>, disabledTriggers: Record<piece, trigger[]> }`
- **includeNewPieces / includeNewActions** — when false, newly installed pieces/actions are auto-added to the set's disabled lists via the piece-install hooks
- **generatedForProjectId** — non-null for sets auto-created per-project by managed auth (embed) from legacy `piecesTags` / `piecesFilterType` claims

## Entity (`piece_set`)
| Column | Type | Notes |
|---|---|---|
| id / created / updated | base | `BaseColumnSchemaPart` |
| platformId | ApId | owner; CASCADE on platform delete |
| name | string | |
| externalId | string (nullable) | vendor-supplied id; unique per platform when set |
| isDefault | boolean | one per platform (partial unique index) |
| includeNewPieces | boolean | default true |
| includeNewActions | boolean | default true |
| generatedForProjectId | ApId (nullable) | set when auto-generated per project |
| config | jsonb | `PieceSetConfig` |

Indexes: `(platformId)`; unique partial `(platformId) WHERE isDefault`; unique partial `(platformId, externalId) WHERE externalId IS NOT NULL`. Projects reference a set via `project.pieceSetId` (FK `SET NULL`) — see [ee-projects.md](./ee-projects.md).

## Endpoints (`/v1/piece-sets`, platformAdminOnly: USER + SERVICE)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List sets for the platform (cursor paginated) |
| POST | `/` | Create a set |
| GET | `/:id` | Get a set |
| POST | `/:id` | Update name/flags + patch config (enable/disable pieces/actions/triggers) |
| DELETE | `/:id` | Delete (Default protected); reassigns its projects to Default |
| POST | `/:id/duplicate` | Clone config under a new name |
| POST | `/:id/projects` | Assign one or more projects to the set |
| DELETE | `/:id/projects/:projectId` | Reassign a project back to Default |

## Service Methods (`pieceSetService`)
- `getOrCreateDefaultPieceSet(platformId)` — returns the Default set, creating it under a distributed lock (`piece_set_default_<platformId>`) if missing
- `list / getOne / create / update / delete / duplicate` — standard CRUD; `update` applies enable/disable patch ops onto `config`, never replacing it wholesale
- `assignProject / removeProjectAssignment` — write `project.pieceSetId`; removal falls back to Default
- `handleNewPieceInstalled({ platformId, pieceName, isNewPiece, newActionNames, newTriggerNames })` — for every set with `includeNewPieces`/`includeNewActions` off, appends the new piece/actions/triggers to its disabled lists

## Integration Notes
- **Project creation** (`ee-project-hooks.ts`): new EE projects are assigned the Default set on `postCreate` when `managePiecesEnabled`.
- **Managed auth** (`managed-authn-service.ts`): an embed JWT may carry a `pieceSet` externalId claim to assign an existing set; legacy `piecesTags`/`piecesFilterType` claims auto-generate a per-project set (`generatedForProjectId`). See [managed-auth.md](./managed-auth.md).
- **Migrations**: `1797000000000-AddPieceSetTable`, `1798000000000-MigratePieceSetConfig`, `1799000000000-BackfillPieceSets` create the table and migrate/backfill existing per-project config into sets.
