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
- **A piece silently vanishes from the list when its `minimumSupportedRelease` is ahead of the root `package.json` version.** `fetchLatestPieces` filters every piece through `isSupportedRelease(apVersionUtil.getCurrentRelease(), piece)`. Pieces are routinely merged targeting the *next* release, so on `main` a couple dozen are invisible locally until the version bump lands. No warning is logged — it just isn't there.
- **DynamicProperties clears its value before it knows the new schema, so the merge source must be a snapshot.** `DynamicPropertiesImplementation` re-fetches the child schema on every refresher change, clearing the form value synchronously and re-populating it in the mutation callback. The merge source for `getDefaultValueForProperties` has to be a `lastKnownValue` ref captured *before* the clear — reading `form.getValues()` in the callback sees the cleared `null` and defaults every child (GIT-1514). The snapshot must be spread-cloned: RHF `getValues(name)` hands back the live object and the clear's `setValue(...child, null)` mutates it in place. Guard the ref with `isNil` so it survives rapid successive changes, where later effect runs already observe `null`.
- `DynamicPropertiesContext` tracks loading by property name only, so two in-flight requests for the same property let the first completion clear the flag for both — briefly re-enabling Test Step while the value is still cleared.
- **The frontend `POST /v1/pieces/options` client only rejects for DYNAMIC.** `piecesApi.options` (`packages/web/src/features/pieces/api/`) catches DROPDOWN failures, toasts, and *resolves* with a disabled-dropdown fallback — so for dropdowns every error path wired onto that mutation is dead: `usePieceOptions`' `onError` handlers, its `retry: 1`, and the `if (error) throw error` into `DynamicPropertiesErrorBoundary`. DYNAMIC must rethrow: a swallowed failure arrives as a *successful* empty schema, which resets the property's children to defaults and gets persisted by step-settings autosave.
- **`AP_DEV_PIECES` shadows the DB registry copy by name**, so a dev piece failing the release gate removes the piece *entirely* rather than falling back to the published version. Dropping the name from `AP_DEV_PIECES` (or bumping the local root `package.json`) brings it back.
- **A piece search narrows `suggestedActions` to the actions that matched — and matching the *piece* name matches all of them.** `pieceSearching.search` (`pieces/metadata/utils/piece-searching.ts`) runs Fuse over the pieces, then re-runs a nested Fuse per hit through `searchForSuggestion` and returns only the matching actions/triggers. That nested search includes `pieceDisplayName` in its keys and stamps it onto every action, so querying "slack" scores every Slack action as a suggestion, while "archive channel" returns a short list. So `suggestedActions` on a search response is *the answer to the query*, not the piece's full catalogue — a UI that expands search results is showing what matched, and one that caches them must key on the query. Without a `searchQuery` the field is the normal suggestion set instead.

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
