---
icon: 🧩
---

# Pieces

The metadata catalog of automation integrations ("pieces") — each a named integration like `@activepieces/piece-gmail` providing actions and triggers. Stored in `piece_metadata` and served from an in-memory `pieceCache` rebuilt from the DB on startup and refreshed via pub/sub.

### Entities & services
- `piece_metadata` (PieceMetadataEntity) — unique on `(name, version, platformId)`; `platformId` null = official, set = custom piece for that platform. `actions`/`triggers` are JSON maps (each may carry an optional `outputSchema`).
- `pieceMetadataService` — `list` / `getOrThrow` / `listVersions` / `create` / `delete` / `registry`; owns cache interactions.
- `pieceInstallService.installPiece` — saves archive, dispatches an `EXECUTE_METADATA` engine job to extract metadata, then stores it.
- `pieceSyncService.sync` — upserts official pieces from the bundled registry file.
- Routes under `/v1/pieces`: list, `:name` get, `:name/versions`, `POST /options` (dynamic dropdown eval on a worker), `POST /` (platformAdmin — install custom piece), `POST /sync`, `DELETE /:id`.

### Types
- **PieceType** — `OFFICIAL` (bundled) or `CUSTOM` (platform-installed).
- **PackageType** — `REGISTRY` (NPM) or `ARCHIVE` (uploaded tarball; `archiveId` FKs to `file`).
- **OutputSchema** — optional per-action/trigger structured render hint (`fields`, `itemLabel`); set by the piece author, consumed by the builder's Smart Output Viewer and data selector. Opt-in and non-breaking.

### Gotchas
- Available all editions; base listing + install is Community-level.
- EE/Cloud per-piece and per-action/trigger visibility flows through `resolveVisibility` (`ee/pieces/filters/piece-filtering-utils.ts`), which returns a `VisibilityPolicy` or `null` on CE / when `platformId`/`projectId` is nil (callers treat `null` as no filtering). The policy is derived from the project's **piece set** (via `project.pieceSetId`, falling back to the platform Default).
- Install and sync also enqueue a tool-search reindex, but only when `isToolSearchEnabled()`; no-op otherwise.
- `delete` removes all versions sharing the name on that platform, and only for `CUSTOM` pieces the caller owns.

### Key files
Entry point: `pieceModule`, the Fastify plugin registered in `packages/server/api/src/app/app.ts` that mounts every `/v1/pieces` route.

- `packages/server/api/src/app/pieces/metadata/` — controller, service, TypeORM entity, and the pub/sub-invalidated `piece-cache.ts`
- `packages/server/api/src/app/pieces/` — `community-piece-module.ts` (POST `/v1/pieces` install), `piece-install-service.ts`, `piece-sync-service.ts`
- `packages/server/api/src/app/ee/pieces/filters/piece-filtering-utils.ts` — `resolveVisibility` and the EE/Cloud `VisibilityPolicy`
- `packages/web/src/features/pieces/api/` — frontend HTTP client
- `packages/web/src/features/pieces/hooks/` — React Query hooks for listing, piece model, options, and output schema
- `packages/web/src/features/pieces/components/` — `PieceIcon`, `PieceIconList`, `PieceSelectorSearch`, `InstallPieceDialog`
- `packages/pieces/framework/src/lib/output-schema.ts` — `OutputSchema` / `OutputSchemaField` / `FieldFormat` types

Paths verified 2026-07-17.
