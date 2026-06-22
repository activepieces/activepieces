# @activepieces/core-utils

Tier-1 foundation: framework-agnostic utilities, primitives, errors, and ID
helpers that the rest of the codebase builds on.

## Principles

- **Must be tree-shakeable.** It is bundled into every piece (and the engine), so
  keep it small, side-effect-free (`"sideEffects": false`), and acyclic.
- **May import other `@activepieces/core-*` packages only** — never `server`,
  `web`, `pieces`, or `shared`. Enforced by the `no-restricted-imports` boundary
  lint in `.eslintrc.json`.
