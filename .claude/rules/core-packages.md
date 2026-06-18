`packages/core/<name>` packages are named `@activepieces/core-<name>` (e.g. `packages/core/utils` → `@activepieces/core-utils`).
These packages are framework-agnostic foundation libraries: they MUST NOT import from `@activepieces/shared`, `@activepieces/server-*`, any piece package, or any web/React package. The dependency graph must stay acyclic.
Every `packages/core/*` package ships dual-format (CJS + ESM) via tsup with `"sideEffects": false` in its `package.json`.
