---
id: release-0-86-0
title: "0.86.0"
added: '2026-06-18'
release: 0.86.0
legacy: true
---

### What has changed?

#### Log fields are now grouped by entity
Log fields are now grouped under the entity they belong to, so each thing has one name. A flow run id is `flowRun.id` (it used to appear as `runId`, `flowRunId`, or a bare `id`), and other ids follow the same shape (`flow.id`, `project.id`, `job.id`, …). Errors are logged under `error`. This only changes how logs look — nothing about the API, database, or flows changes.

#### Google SSO is configured via environment variables only
"Sign in with Google" can no longer be enabled from the SSO page in the admin panel — that setting has been removed. It is now controlled solely by the `AP_GOOGLE_CLIENT_ID` and `AP_GOOGLE_CLIENT_SECRET` environment variables. The button only appears when both are set (and the platform's Google auth toggle is enabled).

#### Pieces are now self-contained bundles
Each piece is now built into a single self-contained bundle — its own code, the Activepieces framework, and its third-party dependencies are inlined into one artifact, so the engine provisions a piece by downloading one file instead of installing a dependency tree at runtime. As part of this, the shared libraries (`@activepieces/shared`, `@activepieces/pieces-framework`, `@activepieces/pieces-common`, `@activepieces/core-*`) are no longer published to npm, and pieces import only from `@activepieces/pieces-framework` (which re-exports the foundation symbols that used to come from `@activepieces/shared`). Built-in pieces are unaffected — this only matters for custom pieces.

#### `AP_PRE_WARM_CACHE` removed
The `AP_PRE_WARM_CACHE` environment variable no longer exists. It used to make a worker install pieces into its cache on startup. The worker is now its own sandbox and fills its cache lazily on first use, so the flag has no effect and setting it does nothing. Cache warmth now comes from running long-lived worker replicas rather than an up-front install step.

The up-front install is no longer needed because piece installs are now fast: each piece is a self-contained bundle fetched as a single file. If you have S3 enabled, official piece bundles are cached to your S3 bucket on first use and served from there via signed links — so when your bucket is co-located in the same region as your workers, subsequent installs are a low-latency download from a nearby object store instead of a registry round-trip.

<Note>
Removed in 0.88.2: bundles are no longer mirrored into your S3 bucket. Every download goes to npm or, with `AP_USE_CDN_FOR_BUNDLES=true`, to the CDN.
</Note>

### Do you need to take action?
- Only if you set up Google SSO from the admin panel. Move your Google OAuth2 credentials into the `AP_GOOGLE_CLIENT_ID` and `AP_GOOGLE_CLIENT_SECRET` environment variables.
- Only if you build dashboards or alerts on Activepieces logs. Update them to the new grouped names, e.g. `runId` → `flowRun.id` and `err` → `error`.
- Only if you maintain **custom pieces** (in a fork or built outside the repo). Migrate each one to the bundle model — run `npm run cli -- pieces migrate <piece-name>` (or `--all`), or follow the [migration guide](/build-pieces/misc/migrate-pieces-to-bundles). Pieces that still import `@activepieces/shared` or depend on the now-unpublished libraries will fail to build.
- Only if your deployment sets `AP_PRE_WARM_CACHE`. Remove it from your environment — it is no longer read. Nothing else is required.
