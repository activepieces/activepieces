# Freeze resolved piece versions in the Flow Bundle manifest

The Flow Bundle (a per-locked-flow-version artifact served from object storage) carries a `pieces.json` manifest of the resolved `PiecePackage[]`. We decided to **freeze** those versions at bundle-build time rather than re-resolve `^`-range piece specs on every run as the engine does today.

## Why

A locked flow version is meant to be an immutable snapshot — the bundle already freezes the flow definition and the compiled code steps, so letting piece ranges silently float to newer patches under a "locked" version is the more surprising behavior. Freezing makes a locked version byte-reproducible forever and eliminates the per-piece `getPiece` resolution round-trips at run time (the precompute win the manifest exists for).

## Status

Accepted — **already enforced by existing code; no new freeze logic required.**

## How it is enforced

The freeze is a property the bundle's `pieces.json` inherits "for free" because piece versions are already pinned to exact values *before* a flow version is locked:

- Every piece edit normalizes the version via `flowPieceUtil.getExactVersion()` (strips `^`/`~` → `1.2.3`), in both the core `flowOperations.apply` (`packages/core/execution/src/lib/flows/operations/index.ts`, `ADD_ACTION` / `UPDATE_ACTION` / `UPDATE_TRIGGER`) and the server-side `prepareRequest` (`flow-version-validator-util.ts`).
- **Imports are covered too:** `IMPORT_FLOW` does not normalize directly, but `_importFlow` (`operations/import-flow.ts`) decomposes the imported flow into `UPDATE_TRIGGER` + `ADD_ACTION` sub-operations that re-enter `flowOperations.apply` — so every imported piece step passes through `getExactVersion`. Templates / git-sync / marketplace imports are therefore pinned just like edits.
- `LOCK_FLOW` (`operations/index.ts`) only flips `state → LOCKED`; by then versions are already exact.
- Pre-existing locked flows were pinned by the one-time `migrateV12FixPieceVersion` migration.

Because locked versions therefore hold exact versions, `EXACT_VERSION_REGEX` passes in `pieceCache.getPiece` and there is no runtime re-resolution / float. When the bundle builder reads those versions into `pieces.json`, they are frozen by construction. A dedicated lock-time `lockPieceVersionUtil` was prototyped and found redundant against this existing path, so it was not added.

## Consequences

- **Behavior change:** locked flows stop auto-picking-up newer piece patches from `^`-ranges. To get a newer piece version, re-lock (produce a new flow version), which builds a fresh bundle.
- **Hard to reverse:** bundles are immutable and content-addressed by `flowVersionId`; reverting to floating would require invalidating/rebuilding the stored bundle population.
- Draft versions are unaffected — they always build locally and resolve pieces live.
