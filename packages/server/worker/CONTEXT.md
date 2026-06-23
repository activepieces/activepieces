# Worker Runtime — Context Glossary

Canonical terms for the multi-runtime / serverless-cache work. Glossary only — no implementation details.

## Terms

### Runtime
The **where/how-to-host** abstraction — *not* an execution seam. It hosts the Sandbox Pool and
decides how jobs arrive and with what config. `RuntimeKind` = `LOCAL` (the worker embeds the pool at
concurrency N and pull-polls for jobs) or `GCP_CLOUD_RUN` (an HTTP server pushes jobs to the pool at
concurrency 1, `basePath` = ephemeral disk). The Runtime/host layer is thin and lives **outside** the
`@activepieces/sandbox-pool` library; `RuntimeKind`, host selection, and any deploy-specific wiring
live here. Avoid the word "serverless"; the mode is `GCP_CLOUD_RUN`.

### RuntimeExecution (removed)
The old polymorphic `Runtime`/`RuntimeExecution` interfaces (meant for multiple execution impls,
selected by a factory, with a GCP stub) are **overkill** — there is exactly one execution impl. They
are deleted. The pool's per-job lifecycle (`init → run → dispose`, driven by the host for atomic init
and invalidate-on-result) survives as a **concrete** pool API, not an abstract seam.

### Warm / Stateful Cache
The Execution Cache is stateful and reused while its host is warm — the **same** property in both
modes. `LOCAL` is effectively always warm (long-lived host, persistent base path). `GCP_CLOUD_RUN` is
warm for the life of a Cloud Run instance (base path on its writable mount). There is no gcp-special
"ephemeral" cache and no divergent eviction path — it is one stateful cache whose only per-mode
difference is the injected **base cache path**.

### Piece Bundle
A pre-built artifact for one `piece@version`, content-addressed by piece name + version. Built once
and reused across every flow that uses that piece. In serverless mode it is the **`bun install`
output packed as a tar.gz** (PIECE_TAR_GZ-shaped), stored in an S3 bucket **co-located with the
compute** for low-latency fetch — produced by re-packing *every* piece (including ones that are
`REGISTRY` today) into a tarball, so the hot path never runs `bun install`. In local-pool mode it is
an installed `node_modules` folder in the on-disk cache. **One concept, two materializations.**

### Flow Code Bundle
A pre-built artifact for one flow-version's code steps (all code steps for a given `flowVersionId`,
compiled/bundled). Content-addressed by `flowVersionId` (code is immutable per version). Distinct
from a Piece Bundle: it is per-flow, not shared across flows.

### Provision
The act, inside `Runtime.init`, of making a job's pieces + code + engine available where `run` will
read them. Local-pool provisions host-side into the mounted cache; serverless provisions by fetching
bundles into the function. Atomic: either fully ready or cleans up before throwing.

### Dispatcher
The thin, warm, **pull-based** component that stays on Activepieces' side in serverless mode.
Consumes the BullMQ queue exactly as the worker does today, holds the app socket and version gate,
does **no** bundling on the hot path, and per job resolves the flow's pieces + code to S3 keys and
**pushes** one job to an Executor. It is what remains of today's worker after the execution unit is
carved out.

### Executor
The unit that actually runs a job's engine operation. In local-pool it is a forked engine child of
the worker, sharing the worker's on-disk Execution Cache. In serverless it is a lean, push-triggered,
autoscaled Cloud Run service (engine + a fetch layer) with its own `/tmp` Execution Cache, talking to
the API directly (no loopback socket). The Execution Cache + Materialize live **in the Executor**, not
in the Dispatcher.

### Provision (one method)
The execution handle exposes a single `provision(input)` whose `flow` / `pieces` / `codes` are all
**optional** — whatever is absent is simply not provisioned (no `source` discriminator). When `flow`
(`{ id, versionId, projectId }`, `platformId` top-level) is present, provision resolves its
`flowVersion` + pieces + code **internally** via the now-private `flowCache`/`pieceCache`; explicit
`pieces`/`codes` are materialized as given. It materializes the union of both. Returns `{ kind:
'ready', flowVersion? } | { kind: 'flow-not-found' } | { kind: 'disabled' }` (`flowVersion` only when
`flow` was given); each job maps that result to its own reporting. Flow resolution runs **before** a
sandbox lane is acquired, so a missing piece never wastes a slot. `flowCache`, `pieceCache`,
`resolveFlowArtifacts`, `PieceNotFoundError`, and the `disableFlow` side-effect are package internals —
execute/jobs import only the handle.

### Execution Cache
A content-addressed on-disk store of materialized entries (one per `piece@version`, one per
`flowVersionId` code bundle), keyed identically in both runtimes. Present in **both**: `LOCAL` keeps
it under `cache/v<n>` on the worker host; `GCP_CLOUD_RUN` keeps it under its writable mount. Keying,
folder layout, locking, and `ready`-marker validation are the same. The **only** per-mode difference
is the injected **base cache path** (see [[#base-cache-path]] below) — not the materialize logic.

### Materialize
How an absent Execution Cache entry is filled. **There is one materializer**, identical for both
runtimes — it already handles archive pieces by download-and-extract. Serverless does **not** get a
different materializer; it gets the same one, fed archive-type bundles from a co-located bucket. The
only thing that differs between local-pool and serverless is **pool concurrency** (N vs 1), not the
materialize code path.

### Sandbox Pool
The extracted package `@activepieces/sandbox-pool` (`packages/server/sandbox-pool`): the **single,
concrete** execution implementation — the pool of sandboxes + Execution Cache + engine-spawn that runs
engine operations. Hosting-agnostic: it knows nothing about queues, HTTP, or `RuntimeKind`. Public
surface ≈ `createSandboxPool({ basePath, concurrency })` → `{ createExecution → (init/run/dispose),
getActiveExecutors, shutdown }`. A host (the worker for `LOCAL`, an HTTP app for `GCP_CLOUD_RUN`)
constructs it with the two knobs that differ — **concurrency** and **base cache path** — and drives
the lifecycle. Nothing in the execution path itself diverges by mode.

### SandboxPoolSettings / config injection
The library is hosting-agnostic, so it reads **no** worker env. `createSandboxPool` takes
`{ basePath, concurrency, getSettings, log }`. `getSettings()` is a **provider function** (not a static
snapshot) returning `SandboxPoolSettings` — the fields the pool reads (`EXECUTION_MODE`, `DEV_PIECES`,
`ENVIRONMENT`, `REUSE_SANDBOX`, `FLOW_TIMEOUT_SECONDS`, `MAX_FILE_SIZE_MB`, `MAX_FLOW_RUN_LOG_SIZE_MB`,
`NETWORK_MODE`, `SANDBOX_MEMORY_LIMIT`, `SANDBOX_PROPAGATED_ENV_VARS`, `SSRF_ALLOW_LIST`). A provider
(not a value) preserves today's fresh-each-call read, since the worker refetches settings on reconnect.
The worker passes `workerSettings.getSettings`; a gcp host passes its own. `utils/exec` is a pure util
that moves into the package.

### Base Cache Path
An explicit **parameter of the `@activepieces/sandbox-pool` library** (threaded through to the path
helpers — not a global env read inside the lib). The caller supplies it: the worker passes the
cwd-relative `cache`; the `GCP_CLOUD_RUN` image passes its ephemeral-disk mount. All path helpers
(`common`, `codes`, `pieces-metadata`, `flows`, engine) derive from it. Today it is hardcoded as
`path.resolve('cache', LATEST_CACHE_VERSION)`; lifting that literal into a param is the change. This
plus **concurrency** are the only two inputs that differ per mode.
