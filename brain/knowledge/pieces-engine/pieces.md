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
- **Zod does not leak in pieces — there is nothing to turn off (checked 2026-09-02).** zod 4.3.6's global registry lives at `globalThis.__zod_globalRegistry` and holds schemas in a **`WeakMap`**; its one strong store, `_idmap`, is populated only by an explicit `.meta({ id })` / `.register()`, and grepping all of `packages/pieces` + `packages/core` finds **zero** such calls. Note the once-true half of this that no longer holds: pieces are loaded into the long-lived engine process now, not a per-call child, so nothing is freed by process exit — eviction from the `MAX_LOADED_PIECES` LRU is what frees a piece. Details worth not re-deriving:
  - Zod *is* bundled into each piece (189 zod tokens in math-helper 0.0.30's 72 KB bundle), but as `zod/mini` — 49 of 51 framework imports use `zod/mini`, only 2 use full `zod`.
  - `piecePropertiesUtils.buildSchema` is the only code that builds schemas per-property at runtime, and it is called **only** from the web app and the API's `flow-version-validator-util.ts`. It never runs on the engine/piece-child execution path, so there is no per-call schema construction when a flow executes.
  - **Measured per-module, from `math-helper@0.0.22`'s own dependency tree:** `zod` full **1.92 MB** heap / 17 ms, `zod/mini` **1.81 MB** / 14 ms, `ai` 6.14 MB, `socket.io-client` 3.96 MB, `@opentelemetry/api` 0.80 MB — and **`@activepieces/shared` 45.45 MB / 128 ms on its own**. Zod is a rounding error next to `shared`.
  - **`zod/mini` is not a memory optimisation** — it saves **0.11 MB** of heap over full `zod`. It wins on bundle size and locale count, nothing else. Do not switch to it expecting heap back.
  - **What bundling + decoupling actually bought** (3 runs each, fresh process, `--expose-gc`): `math-helper@0.0.22` → `@0.0.30` goes from **55 npm packages to 1**, **35 MB `node_modules` to 132 KB**, **210 ms to 19 ms** load, and **92.26 MB to 1.39 MB heap** — a 66× cut, almost all of it from dropping `@activepieces/shared` and its `ai`/`socket.io` tail. A 3-action math piece and the webhook piece cost the same ~1.4 MB at 0.0.30, so that residue is the framework floor, not the piece — and **that floor is zod**: `zod/v4/core` alone imports at 1.53 MB heap / ~14 ms, which is the whole of it.
  - **There is no piece-child process on `main` — pieces are `require()`d into the engine process, capped at `MAX_LOADED_PIECES = 5` with LRU eviction** (`packages/server/engine/src/lib/helper/piece-loader.ts`, #14859). So a bundled piece's module-load cost is paid up to five times over concurrently, and anything a piece bundle carries is live heap in the worker until it is evicted. Notes written against an older forked-piece-child architecture do not apply.
  - **The framework's 54 top-level zod schemas were dead weight and are gone (PR #15213).** They put the *full* zod runtime — 316 KB — into all 757 piece bundles. See `building-pieces.md` for the measurements, why tree-shaking could not drop them, and the bundler gate that keeps zod out now.
  - **64 pieces import zod themselves**, essentially all for `propsValidation.validateZod` in `@activepieces/pieces-common`; they keep ~11 KB of tree-shaken zod each. Every other piece now bundles none.
  - Grep trap: checking for zod in a bundle with a shell-escaped `\$ZodType` pattern silently matches nothing and reads as "zod was tree-shaken out". Match on `ZodMini|_zod|ZodType` instead.
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
