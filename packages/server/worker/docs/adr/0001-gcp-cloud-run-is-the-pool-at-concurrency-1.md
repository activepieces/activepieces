---
status: accepted
---

# GCP_CLOUD_RUN is the LOCAL pool at concurrency 1, not a separate execution path

## Context

We want Activepieces to scale elastically by running the engine on autoscaled GCP Cloud Run
instances. The tempting framing is "serverless = a new Runtime with its own cache, its own
materializer (download bundles from S3), and the engine talking direct-to-API with no loopback
peer." That framing means a second execution code path to build and test forever — the thing we most
wanted to avoid.

## Decision

There is **one** execution path, packaged as `@activepieces/sandbox-pool` (sandbox pool + Execution
Cache + materialize + engine spawn, extracted from `packages/server/worker`). `RuntimeKind` is `LOCAL`
or `GCP_CLOUD_RUN`, and the two modes are the **same pool** differing only in two injected inputs:

- **`basePath`** — the cache root, a library parameter. `LOCAL` passes cwd-relative `cache`;
  `GCP_CLOUD_RUN` passes its ephemeral-disk mount.
- **`concurrency`** — `LOCAL` runs N; `GCP_CLOUD_RUN` runs **1**, so Cloud Run autoscales instances
  1:1 with concurrent jobs and the instance is itself the tenant-isolation boundary.

`GCP_CLOUD_RUN` is a thin Docker image: an HTTP server that drives the pool's
`createExecution → init → run → dispose` per pushed job. A warm, **pull-based** dispatcher stays on our
side and pushes one job per request (Cloud Run autoscales on inbound HTTP, so the puller cannot be the
autoscaled unit).

## Considered options

- **Separate serverless Runtime + separate cache + new materializer.** Rejected: it is the divergent,
  double-test-surface path. The existing `pieceInstaller` ARCHIVE path already does pure
  download-and-extract and, for `bundleDeps` pieces, skips `bun install` entirely — so feeding the
  pool self-contained `bundleDeps` ARCHIVE bundles from a co-located bucket needs **zero** new
  materializer code.
- **Engine runs in-process (no fork) on Cloud Run, talking direct-to-API.** Rejected for v1: it
  deletes the proven sandbox/fork/loopback-socket machinery for a cold-boot win that the
  concurrency-1 **warm pool already amortizes** (the forked engine is reused across jobs on a warm
  instance). Kept as a future `SandboxStrategy` seam if cold boot proves to be the bottleneck.

## Consequences

- The cache is **not** ephemeral-per-job on gcp; it is the same warm/stateful cache, bounded by the
  instance lifetime. We use **ephemeral disk** (not tmpfs/RAM) for the mount so a long-warm cache does
  not eat the instance memory budget (cf. the engine-orphan OOM-ratchet incidents).
- The engine keeps its loopback `socket.io` peer even on Cloud Run (localhost); we point `apiClient`
  at the real API rather than rewriting the engine transport. The "direct-to-API, no loopback peer"
  ambition in the old `types.ts` comment is **dropped**.
- New work is narrow: extract `@activepieces/sandbox-pool`; lift the hardcoded `cache` literal into a
  `basePath` param; the gcp Docker + HTTP wrapper; a publish-time pipeline emitting `bundleDeps`
  ARCHIVE bundles to the co-located bucket (seeded by the `#13838` piece-bundle migration CLI); and
  the enum rename `LOCAL_POOL → LOCAL`, `GCP_CLOUD_FUNCTION → GCP_CLOUD_RUN`.
