# Piece Management

## Summary
The pieces feature manages the metadata catalog of automation integrations (called "pieces") and exposes APIs for listing, fetching, versioning, and installing custom pieces. Pieces are stored in `piece_metadata` and served via an in-memory cache (`pieceCache`) that is rebuilt from the database on startup and refreshed via a pub/sub channel. Platform admins can install private (custom) pieces by uploading a tarball or referencing an NPM package; these are scoped to the platform with a `platformId`. The `options` endpoint runs dynamic piece property evaluation on a worker.

## Key Files
- `packages/server/api/src/app/pieces/metadata/piece-metadata-controller.ts` — all piece routes registered under `/v1/pieces`
- `packages/server/api/src/app/pieces/metadata/piece-metadata-service.ts` — list, get, create, delete piece metadata; manages cache interactions and piece tag enrichment
- `packages/server/api/src/app/pieces/metadata/piece-metadata-entity.ts` — `piece_metadata` TypeORM entity
- `packages/server/api/src/app/pieces/metadata/piece-cache.ts` — Redis/memory cache with pub/sub invalidation
- `packages/server/api/src/app/pieces/community-piece-module.ts` — POST `/v1/pieces` for installing custom pieces
- `packages/server/api/src/app/pieces/piece-install-service.ts` — saves archive, calls engine to extract metadata, stores result
- `packages/server/api/src/app/pieces/piece-sync-service.ts` — syncs canonical piece registry from NPM/bundled artifacts into DB
- `packages/server/api/src/app/pieces/tags/` — tag entity, tag service, tag-module for organizing pieces into groups
- `packages/web/src/features/pieces/api/pieces-api.ts` — frontend HTTP client
- `packages/web/src/features/pieces/hooks/pieces-hooks.ts` — React Query hooks for piece listing, piece model, piece options
- `packages/web/src/features/pieces/hooks/use-piece-output-schema.ts` — reads `outputSchema` for a given step (PIECE action or trigger) off the cached piece model; shares the existing `['piece', name, version]` React Query cache so no extra network call is made
- `packages/web/src/features/pieces/components/` — `PieceIcon`, `PieceIconList`, `PieceSelectorSearch`, `InstallPieceDialog`
- `packages/pieces/framework/src/lib/output-schema.ts` — `OutputSchema` / `OutputSchemaField` / `FieldFormat` plain TypeScript types (embedded into the piece metadata via `z.custom`)

## Edition Availability
All editions. Piece filtering by allowed/blocked list and EE-specific filtering are gated in `enterpriseFilteringUtils` but the base listing and installation is Community-level.

## Domain Terms
- **Piece** — a named integration (e.g. `@activepieces/piece-gmail`) providing actions and triggers
- **PieceType** — `OFFICIAL` (bundled) or `CUSTOM` (platform-installed)
- **PackageType** — `REGISTRY` (NPM) or `ARCHIVE` (uploaded tarball)
- **pieceCache** — an in-memory map of piece metadata keyed by name+version+platformId, rebuilt from DB
- **PieceCategory** — enum grouping pieces (AI, CORE, COMMUNICATION, etc.)
- **SuggestionType** — AGENT or ACTION; changes ordering in piece selector
- **OutputSchema** — optional, per-action / per-trigger structured description of how the step's output should be rendered. Shape: `{ fields: OutputSchemaField[] }`. Each `OutputSchemaField` carries `key`, optional `label` / `value` (path override) / `description`, an optional `format` (`email` / `url` / `date` / `datetime` / `number` / `boolean` / `image` / `html` / `currency` / `filesize` / `duration`), optional `currency` ISO code, optional `dynamicKey: true` for map-shaped values, and optional recursive `children` / `listItems` for nested objects and array-of-record shapes. Set by the piece author as the `outputSchema` of `createAction` / `createTrigger`. Consumed by the builder's `SmartOutputViewer` and the data selector — see [flows.md](./flows.md). Opt-in and non-breaking: pieces without an output schema render exactly as before.

## Entity

### `piece_metadata` (`PieceMetadataEntity`)
| Column | Type | Notes |
|---|---|---|
| id | string | ApId |
| name | string | e.g. `@activepieces/piece-gmail` |
| displayName | string | |
| version | string | semver, collation-sorted |
| authors | string[] | |
| logoUrl | string | |
| description | string (nullable) | |
| platformId | string (nullable) | null = official; set = custom piece for that platform |
| actions | json | map of action definitions (each may include an optional `outputSchema` blob) |
| triggers | json | map of trigger definitions (each may include an optional `outputSchema` blob) |
| auth | json (nullable) | auth property definition |
| pieceType | string | `OFFICIAL` or `CUSTOM` |
| packageType | string | `REGISTRY` or `ARCHIVE` |
| archiveId | ApId (nullable) | FK to `file` for ARCHIVE type |
| categories | string[] (nullable) | |
| minimumSupportedRelease | string | semver |
| maximumSupportedRelease | string | semver |
| projectUsage | number | usage counter |
| i18n | json (nullable) | translation map |

Unique index on `(name, version, platformId)`.

## Endpoints

| Method | Path | Security | Description |
|---|---|---|---|
| GET | `/v1/pieces` | unscoped (all principals) | List pieces with optional filtering (categories, search, suggestionType, locale) |
| GET | `/v1/pieces/categories` | public | Return all `PieceCategory` values |
| GET | `/v1/pieces/registry` | unscoped (all principals) | Registry manifest (name+version) for a given release |
| GET | `/v1/pieces/:name` | unscoped | Get full piece metadata by name (latest or pinned version) |
| GET | `/v1/pieces/:scope/:name` | unscoped | Get piece with scoped name (e.g. `@org/piece`) |
| GET | `/v1/pieces/:name/versions` | project (USER, QUERY) | List all available versions for a piece |
| GET | `/v1/pieces/:scope/:name/versions` | project (USER, QUERY) | Versions for scoped piece name |
| POST | `/v1/pieces/sync` | publicPlatform (USER) | Trigger registry re-sync |
| POST | `/v1/pieces/options` | project (USER, BODY) | Evaluate dynamic piece property options (dropdown values) |
| POST | `/v1/pieces` | platformAdminOnly (USER, SERVICE) | Install a custom piece onto the platform |

## Service Methods

### `pieceMetadataService`
- `list(params)` — returns filtered + sorted `PieceMetadataModelSummary[]` from cache; applies platform piece filters and EE filtering
- `getOrThrow({ platformId, name, version, locale? })` — returns full `PieceMetadataModel` for exact piece; prefers platform-specific over official; applies i18n translation
- `listVersions({ name, platformId, projectId })` — returns all available semver versions from registry cache
- `create({ pieceMetadata, packageType, platformId, pieceType, archiveId? })` — inserts metadata record and invalidates cache
- `registry({ release? })` — returns lightweight name+version list for all pieces

### `pieceInstallService`
- `installPiece(platformId, params)` — saves archive file if needed, dispatches `EXECUTE_METADATA` engine job to extract piece metadata from the package, then stores via `pieceMetadataService.create`

### `pieceSyncService`
- `sync({ publishCacheRefresh })` — reads bundled piece registry file, upserts official piece metadata records, optionally publishes cache refresh event
