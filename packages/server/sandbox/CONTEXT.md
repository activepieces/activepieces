# Sandbox Pool — Context

Glossary for the execution-cache / sandbox domain. Terms only — no implementation details.

## Glossary

### Flow Bundle
A single pre-built artifact, scoped to one **flow version**, containing the **flow definition + compiled custom Code Steps** only. Built for **every locked version** (even ones with no code steps) so it is the **uniform serving path** — the run-time flow definition and code always come from the bundle in object storage rather than a per-run `getFlowVersion` fetch, offloading the API/DB. The bundle also carries a **`pieces.json` manifest** — the resolved `PiecePackage[]` the flow references — so the worker reads the piece list directly on extract instead of re-parsing the flow and re-resolving each piece via `getPiece`. Piece versions in the manifest are **frozen** at bundle-build time (resolved `PiecePackage[]`), so a locked version no longer floats `^`-range pieces — it runs reproducibly forever (see ADR-0001). **Piece *binaries* and the engine are still NOT in the bundle** — they remain the shared, cross-flow, per-worker caches (`piece-installer` / `engine-installer`) exactly as today; only the *manifest of which pieces* is precomputed. Served by the API; the worker's *code-step* preparation degenerates to download + extract, while piece install is unchanged. The bundle serves **all five flow-scoped job types** (`execute-flow`, `execute-trigger-hook`, `execute-webhook`, `execute-polling`, `renew-webhook`) since they share one flow-scoped `provision` keyed by `flowVersionId`. Piece-scoped jobs (`execute-property`, `execute-validation`, `extract-piece-info`) never touch the bundle. Scope is deliberately the lowest-risk slice: no `piece-loader` changes, no per-flow piece dedup loss. Accelerating piece-install latency is explicitly out of scope.

Format is a **`.tgz`** (`flow.json` + `pieces.json` + `codes/<stepName>/index.js`), extracted to `<cache>/v12/bundles/<flowVersionId>/`; the `codes/` subdir mounts to `/root/codes/<flowVersionId>` (same mount target as today). **Invariant:** the local-build path and the download path produce a **byte-identical on-disk tree**, so downstream mount logic has a single path regardless of cache hit/miss, and "upload" is just tarring the dir that was built.

### Code Step
A user-authored custom code action inside a flow (TypeScript). Built (`bun install` + `esbuild`) into a single clean JS file. Per flow version.

### Bundle Build
The act of producing a Flow Bundle (`bun install` + `esbuild` of code steps and pieces). Triggered **lazily on first execution request**. The **API only stores and serves** bundles — it never builds. On a **cache hit** the worker downloads + extracts. On a **cache miss** the **worker builds** the bundle inside its sandbox (the only place with the toolchain and isolation), then **uploads** it back to the API/file service, so the build happens once globally per flow version rather than once per worker. Keyed by immutable `flowVersionId`. On a cold burst, the build is **serialized by a distributed lock** per `flowVersionId`: the first worker builds + uploads; other workers **block** until it's ready, then download — guaranteeing exactly one build.

### Bundle Reference
A **"provisioned" hint** carried in the flow **job data** (a boolean / the `bundleFileId`), stamped by the API at enqueue from the `flow_version.bundleFileId` column. It tells the worker only *whether a bundle exists* — it is **not** a URL. The download endpoint is **deterministic from `flowVersionId`** (`/flow-bundles/{flowVersionId}`), which the worker constructs itself; hitting it makes the API **307-redirect to a fresh presigned S3 URL** (cloud) or **stream the bytes from DB** (self-hosted CE), reusing the existing `signedFileTransport` idiom. The hint exists purely to skip a wasted round-trip on cold/draft.
- **Hint = provisioned** → worker downloads + extracts the bundle from the deterministic endpoint.
- **Hint = not provisioned** → worker builds the bundle locally (today's path) and, **only if the flow version is `LOCKED`**, re-uploads it — serialized by the distributed lock so exactly one worker builds during a cold burst. Local build is therefore both the cold-boot path and the degraded fallback — execution never depends on the bundle store being warm.

Bundles are only ever stored for **`LOCKED`** flow versions (immutable). **`DRAFT`** versions are mutable (builder/test runs) and are **never uploaded** — they always build locally.

Bundles are **stored forever** (no eviction/TTL) — small, immutable, write-once, so cheap to keep; this also means zero invalidation logic. (Optional future: delete-on-flow-deletion for data residency.) State of record is a nullable `bundleFileId` on the `flow_version` row (write-once; no build-version dimension). Upload + registration happen through a **single idempotent API endpoint** that stores the bytes via `fileService` (S3 PUT redirect or DB) and sets `bundleFileId` in the same handler, under the build lock.

### Piece
One of the 400+ integrations a flow references (e.g. Slack, Gmail). Versioned and shared/deduped across flows on a worker. **Not** part of the Flow Bundle — installed by the existing `piece-installer` at provision time as today.

## v1 implementation status

The shipped v1 implements the core mechanism; a few design points above are deliberately deferred (each is a pure optimization over a correct baseline):

- **Artifact format:** v1 uses an **uncompressed JSON manifest** (`{ flowVersion, pieces, codes: [{ stepName, compiledJs }] }`), not a compressed `.tgz` — dep-free (no tar writer), and we control both ends. Compression is a later optimization.
- **Storage / state of record:** the bundle is stored as a `File` with `id = flowVersionId`, `type = FileType.FLOW_BUNDLE` (idempotent upsert). **No `bundleFileId` column and no DB migration** — addressing by `flowVersionId` makes the column unnecessary.
- **Transport:** two methods on the generic socket.io `WorkerToApiContract` — `getFlowBundle` / `uploadFlowBundle` — no HTTP routes.
- **No job-data "provisioned" hint (deferred):** the worker calls `getFlowBundle` on every flow-scoped provision (returns `null` on miss). The hint that skips that round-trip is a follow-up.
- **Best-effort upload, not a blocking distributed lock (deferred):** on a `LOCKED`-version miss the worker builds locally and uploads best-effort (last-write-wins; bundles are immutable so redundant cold-burst builds are wasted CPU, not incorrectness). The "exactly one build" blocking lock is a follow-up.
- **Invalidation:** instead of a build-version, the worker ignores any bundle whose `flowVersion.schemaVersion !== LATEST_FLOW_SCHEMA_VERSION` and rebuilds — so a schema bump self-heals.
- **Code-only payload:** v1 ships compiled `index.js` per code step (what the engine imports); on hit the worker writes them to the code cache and the resolve result reports `code: { kind: 'materialized' }` so install skips compile; on a miss it reports `code: { kind: 'source', steps }` to compile during install. Pieces install via the manifest as normal.

Key files: `cache/flow/flow-provisioning.ts` (resolve hit/miss + publish), `cache/flow/flow-bundle-store.ts` (fetch/publish + codec), `cache/flow/code/code-cache.ts` (compiled-step layout), `sandbox.ts` (lifecycle), `worker-rpc-service.ts` (`getFlowBundle`/`uploadFlowBundle`), `file.service.ts` (`getLocationForFile` → S3 for `FLOW_BUNDLE`), `worker-contract.ts` (contract).

## Modules (post-deepening)

The provisioning code is organized as three nested modules so the bundle hit/miss decision is testable in isolation (each tested through its own interface with a faked `apiClient` / temp dir):

### Flow Provisioning
`cache/flow/flow-provisioning.ts`. The deep seam over "turn a `flowVersionId` into `{ flowVersion, pieces, code }`." `resolve()` hides the Flow Bundle hit vs. fetch-resolve-and-publish decision (and the disable-on-missing-piece path, formerly `flow-artifacts.ts`, now inlined). It returns the code provenance explicitly (`code: { kind: 'materialized' | 'source' }`) and, for a `LOCKED` current-schema miss, a best-effort `publishBundle` handle the runtime invokes after install (compiled code only exists on disk post-install). `sandbox` keeps only sandbox lifecycle: resolve → acquire → install → publish. The `flow-steps.ts` helper is the single home for "which steps of a flow version are Code Steps / Piece steps," shared by Flow Provisioning and the Flow Bundle Store.

### Flow Bundle Store
`cache/flow/flow-bundle-store.ts`. Owns the Flow Bundle end to end and is **local-first** (via `cacheState`): `tryFetch()` returns a cached, current-schema manifest from memory/disk with **no RPC and no writes**; only on a cold miss does it RPC `getFlowBundle`, schema-guard, and materialize compiled code via Code Cache. Misses are never persisted, so a later-published bundle is picked up next run. `publish()` reads code via Code Cache + RPC upload. The worker-side RPC pair is the adapter at this seam; tests use an in-memory adapter and assert a warm second fetch makes no further RPC.

### Code Cache
`cache/flow/code/code-cache.ts`. Single owner of the compiled **Code Step** on-disk layout (`<codes>/<flowVersionId>/<stepName>/index.js`) — read/write/path. Both `code-builder` (Bundle Build miss) and the Flow Bundle Store (hit/publish) go through it, so the byte-identical-tree invariant is enforced by construction, not convention.

### Code Step build-error degradation
`cache/flow/code/code-builder.ts`. Both build phases — **dependency install** (`bun install`) and **compile** (`esbuild`) — degrade a failure into a valid `index.js` stub that `throw`s the captured error at *runtime* (`writeInvalidArtifact`), rather than letting the throw escape `processCodeStep`. This is deliberate: install/compile inputs (`packageJson`, `code`) are **user data**, so a bad one must surface as a **`FAILED` run with the message attributed to the step**, not an opaque **`INTERNAL_ERROR`** from a crashed `provision` (which also gets retried as if it were a transient platform fault). The stub interpolates the message via `JSON.stringify` so backticks/`${}`/newlines in the error can't break the generated module.
