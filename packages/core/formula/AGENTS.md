# @activepieces/core-formula

The formula / expression evaluator (`{{ ... }}` resolution) — used by the engine to
resolve step inputs and by the api/web for validation.

## Principles

- **Must be tree-shakeable.** It is bundled where formulas run (pieces/engine), so
  keep it small, side-effect-free (`"sideEffects": false`), and acyclic.
- **May import `@activepieces/core-*` packages only** — never `server`, `web`,
  `pieces`, or `shared`. Enforced by the `no-restricted-imports` boundary lint in
  `.eslintrc.json`.
