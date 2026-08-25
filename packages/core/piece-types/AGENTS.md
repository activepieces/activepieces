# @activepieces/core-piece-types

The "pieces contract": the type and enum surface that the pieces framework, every
piece, and the engine share to describe a piece — categories, connection types,
trigger strategies, and the piece-facing payload types.

## Principles

- **Must be tree-shakeable.** It is bundled into every piece (and the engine), so
  keep it small, side-effect-free (`"sideEffects": false`), and acyclic.
- **May import `@activepieces/core-utils` only** — never `server`, `web`, `pieces`,
  or `shared`. Enforced by the `no-restricted-imports` boundary lint in `.eslintrc.json`.
