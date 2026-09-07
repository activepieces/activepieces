---
status: accepted
---

# Nothing on the piece path may build schemas at module load

## Decision

A package a piece imports must not construct validation schemas at module scope. `bundlePiece` enforces it: a piece bundle — main or forked entry — may contain zod through **first-party** code only if the piece's own `package.json` declares zod. A third-party SDK shipping its own zod is ignored; that is the dependency's choice, not the piece's.

## Context

`@activepieces/pieces-framework` declared 54 top-level `z.object(...)` consts, each beside a hand-written TS twin of the same name — leftovers of the TypeBox → zod migration that nothing parsed. esbuild must assume a top-level call has side effects, so the modules and the **full 316 KB zod runtime** landed in all 757 piece bundles and were rebuilt on every piece load. The engine `require()`s pieces into its own process with `MAX_LOADED_PIECES = 5`, so a worker paid it five times over: on the `schedule` piece, 2.47 MB heap / 23 MB rss / 23 ms per load, versus 0.31 MB / 2.2 MB / 2.1 ms after (PR #15213).

## Why

Deleting the schemas is the fix, but nothing stops the next barrel re-export from putting them back, and the failure is invisible — every piece silently gets fatter, no test goes red. `sideEffects: false` does not help here: the piece bundler aliases workspace packages to `src`, and esbuild only honours that flag inside `node_modules`. The rejected alternative was structural — subpath-splitting `core-utils` / `core-piece-types` and moving `piecePropertiesUtils.buildSchema` off the framework barrel. Measurement killed it: once the framework stops holding the module graph open, those modules are already shaken out, so the split would have been churn guarding nothing. A build-time gate keyed on the manifest guards the invariant itself rather than today's instance of it.

## Consequences

Six pieces (`ai`, `gmail`, `mcp`, `mcp-client`, `oracle-database`, `forms`, `subflows`) reach a first-party contract module that does build schemas at load, and now declare zod to say so — the manifest reads as "this bundle contains zod on purpose", which is a slightly wider claim than "this code imports zod". The 64 pieces calling `propsValidation.validateZod` keep ~11 KB of tree-shaken zod each; replacing that would mean re-implementing zod's `transform` / `pipe` / `refine` / `union` / `record` surface across ~200 call sites, so it stays. Adding a schema to a shared package that pieces import is now a build failure, not a silent regression.
