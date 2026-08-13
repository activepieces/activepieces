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
- **Piece repackaging only applies to versions published *after* it shipped, and old versions are what leak memory.** Verified Aug 2026 by pulling the actual tarballs: latest versions (`piece-csv@0.4.20`, `piece-hubspot@0.8.9`, `piece-google-sheets@0.16.8`) ship with **`dependencies: {}`** — genuinely self-contained. Older ones do not: `piece-hubspot@0.8.5` declares `@activepieces/shared@0.87.1` + `pieces-framework@0.30.0` + `pieces-common@0.12.3`, `piece-csv@0.4.15` and `piece-ai@0.4.4` declare `shared@0.92.0`. Because flow bundles **freeze piece versions**, flows still on an old version install the unbundled tarball and drag in a pinned `@activepieces/shared` (~2.7–4.1 MB on disk, ~35 MB of module graph once required). On one production worker that produced **12 resident `@activepieces/shared` versions = 388 MB**, which is 95% of the engine's module-cache leak — see the `AP_REUSE_SANDBOX` gotcha on [[workers]]. The fix is re-publishing repackaged builds of the old versions still referenced by live flows; until then the leak persists for any tenant with older flows.
- **The retro CDN bundles exist but are PRIVATE, so the CDN branch silently never fires.** `pieces/retro/` in the `activepieces-cdn` Space holds **1,745 repackaged tarballs, all uploaded 2026-06-28** — the bucket answers anonymous `LIST` fine (which is how you can enumerate it) but every object returns **403 AccessDenied** to anonymous `GET`, on the CDN edge *and* the Spaces origin. `cdnBundleExists` does `axios.head(url, { validateStatus: (s) => s < 500 })`, so a 403 is not an error: `error === null`, nothing is logged, and `exists = status >= 200 && status < 300` is simply **false** → silent fallback to npm. That one ACL is why the whole repackaging effort is inert in production and why old pieces still install `@activepieces/shared`. Fixing the ACL (or fetching with credentials) activates 1,745 piece versions at once. Second, smaller gap: the backfill was a one-off, so versions published after 28 Jun 2026 are absent — those are already bundled at publish time, so it matters less. Also note `USE_CDN_FOR_BUNDLES` is an *app-side* prop (default `'true'`, never read on the worker) that only picks the download **URL**; resolution is archive → S3 (`AP_S3_BUCKET`, set on cloud) → CDN → npm, and `enqueueBundleJob` fills S3 from `npmTarballUrl`, so S3 mirrors npm rather than the CDN.
- Available all editions; base listing + install is Community-level.
- EE/Cloud per-piece and per-action/trigger visibility flows through `resolveVisibility` (`ee/pieces/filters/piece-filtering-utils.ts`), which returns a `VisibilityPolicy` or `null` on CE / when `platformId`/`projectId` is nil (callers treat `null` as no filtering). The policy is derived from the project's **piece set** (via `project.pieceSetId`, falling back to the platform Default).
- Install and sync also enqueue a tool-search reindex, but only when `isToolSearchEnabled()`; no-op otherwise.
- `delete` removes all versions sharing the name on that platform, and only for `CUSTOM` pieces the caller owns.
- **A piece silently vanishes from the list when its `minimumSupportedRelease` is ahead of the root `package.json` version.** `fetchLatestPieces` filters every piece through `isSupportedRelease(apVersionUtil.getCurrentRelease(), piece)`. Pieces are routinely merged targeting the *next* release, so on `main` a couple dozen are invisible locally until the version bump lands. No warning is logged — it just isn't there.
- **`AP_DEV_PIECES` shadows the DB registry copy by name**, so a dev piece failing the release gate removes the piece *entirely* rather than falling back to the published version. Dropping the name from `AP_DEV_PIECES` (or bumping the local root `package.json`) brings it back.

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
