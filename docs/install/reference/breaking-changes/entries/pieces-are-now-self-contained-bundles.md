---
id: pieces-are-now-self-contained-bundles
title: "Pieces are now self-contained bundles"
added: '2026-06-18'
order: 3
release: 0.86.0
---

Each piece is now built into a single self-contained bundle — its own code, the Activepieces framework, and its third-party dependencies are inlined into one artifact, so the engine provisions a piece by downloading one file instead of installing a dependency tree at runtime. As part of this, the shared libraries (`@activepieces/shared`, `@activepieces/pieces-framework`, `@activepieces/pieces-common`, `@activepieces/core-*`) are no longer published to npm, and pieces import only from `@activepieces/pieces-framework` (which re-exports the foundation symbols that used to come from `@activepieces/shared`). Built-in pieces are unaffected — this only matters for custom pieces.

#### What you need to do

Only if you maintain **custom pieces** (in a fork or built outside the repo). Migrate each one to the bundle model — run `npm run cli -- pieces migrate <piece-name>` (or `--all`), or follow the [migration guide](/build-pieces/misc/migrate-pieces-to-bundles). Pieces that still import `@activepieces/shared` or depend on the now-unpublished libraries will fail to build.
