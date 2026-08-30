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
- The **whole** `/v1/piece-sets` module is behind that flag, `GET` included — so on a locked plan the web list query is `enabled: false`, the table is simply empty, and row actions never render. Only toolbar/entry points need a UI guard. The `LockedAlert` + `RequestTrial featureKey="ENTERPRISE_PIECES"` lives once on `PlatformPiecesPage`, above the tabs, since the same flag gates both the Pieces and Piece Sets tabs; the details route redirects back to the tab rather than hanging on a spinner waiting for a query that will never run.
- There is **no** install-time sync and no `onPieceCreated` hook — resolution is purely read-time. See ADR 0001 (visibility derived, not materialized).
- Embed auth: a v4 JWT carries a `pieceSet` key claim; legacy v2/v3 tokens carry `piecesTags` (only the first tag honored, resolved to `key = tag`, else Default). Enforcement (`applyProjectPieceAccess`) runs unconditionally, not gated by the flag.
- **`usePieces({ skipProjectFilter: true })` is not a caching flag — it silently turns piece-set filtering off.** It drops `projectId` from `GET /v1/pieces`, and `resolveVisibility` (`ee/pieces/filters/piece-filtering-utils.ts`) bails to `null` the moment *either* `platformId` or `projectId` is nil, so the response is the unfiltered platform catalog. `platformId` still comes from the principal, so this is not a tenancy hole — but any surface using it advertises pieces a restricted project's flows and MCP server will not actually expose. Correct for platform-admin screens (the piece-set editor has to list pieces you have not permitted yet) and for a marketing-style showcase; wrong anywhere the list implies "what you can use here". The absence of `projectId` is easy to miss at the call site because the flag reads like a client-side concern.

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
