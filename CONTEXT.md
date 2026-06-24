# Activepieces — Execution Runtime

The vocabulary around *where and how a flow job is executed*: the **Worker**, which is itself the **Sandbox** — it polls one job, resolves it, and runs the engine in-process. Parallelism is horizontal (more worker replicas), not internal.

## Language

**Worker**:
The deployment unit and the execution unit, now one and the same. A worker polls **one** job at a time (concurrency 1), acts as **Resolver**, runs the job in its in-process **Sandbox**, and reports the result. It is the only holder of the `apiClient`. Scale is **horizontal**: run N worker replicas, each its own container hard-capped at 0.5 CPU / 1 GB. An OOM kills one worker and the orchestrator restarts it — the blast radius is one job. (Replaces the old split of a poller worker + a separate sandbox pool/Cloud Run.)

**Runtime**:
The worker's **in-process** execution object — `{ execute(params), getActiveExecutors(), shutdown() }`. `execute` materializes the resolved **provision** onto disk, forks the engine child for one operation, and returns the result; it does **not** resolve dependencies (the **Resolver** does, first) and never reaches the app. There is a single implementation — no pluggable seam, no remote transport, no `kind`. (Supersedes the old `createExecution → provision → run → dispose` triad and the `LOCAL`/`GCP_CLOUD_RUN` kinds.)
_Avoid_: executor (means something narrower — see Executor), backend, driver, runtime kind (there is only one).

**Sandbox**:
The **single execution box** the worker runs in-process: given fully-resolved inputs it materializes them onto disk, mounts them, runs **one** engine operation in a child process, and returns the result. It holds **no app connection** — its only outbound traffic is pulling the blobs named in its parameters (S3 by signed URL, npm registry / app file-store for pieces). One worker contains exactly one box; there is no slot multiplexing and no pool inside a process.
_Avoid_: pool (parallelism is replicas now), pool server, sandbox manager (that is the box's internal lifecycle).

**Resolver**:
The role that turns a job into fully-materialized box inputs — resolve the `flowVersion` and piece metadata, and produce a **ready (compiled) `flowBundle`**: on a cache hit, the existing S3 ref; on a miss, **compile the code, build the bundle, and publish it to S3** before handing back the ref (so it retains bun/build tooling). It disables the flow on a missing piece. **Always the worker** (it owns the only `apiClient`). All of this happens *before* `execute` is called, so the box only ever sees healthy, complete, already-compiled inputs.

**execute**:
The **Sandbox**'s single entry point. Takes `{ operationType, operation, timeoutInSeconds, settings, provision }` where **`provision`** groups the resolved dependencies — `{ flowBundle?, pieces?: PiecePackage[], archiveRefs? }` — and returns `{ engineResponse, logs }`. `flowBundle` is the single reference that subsumes `flowVersion` + piece metadata + compiled codes (see **Flow Bundle**) — always a **ready, compiled** artifact (`{ url } | { inline manifest }`), never a build instruction, because the **Resolver** compiles before calling `execute`. It is passed for flow jobs, while piece-only jobs (`execute-property`, `execute-validation`, `extract-piece-info`) pass bare `pieces`. Private-piece archive bytes are *not* in the bundle (platform-shared, deduped) so they ride alongside as `archiveRefs` (S3). Replaces the old `provision → run → dispose` triad at the box boundary: dependency *resolution* moved out to the **Resolver** (the `provision` object is its output), and reuse/teardown is internal.

**resolve** (`Resolver.resolve`):
The **Resolver**'s single method, worker-side. Input `{ platformId, flow? , pieces? }` → `ResolveResult`: `{ kind: 'ready', provision, flowVersion? } | { kind: 'flow-not-found' } | { kind: 'disabled' }`. The handler branches on the outcome and, on `ready`, builds the engine operation from `flowVersion` before calling `execute`. Injected into the job context as `ctx.resolver` alongside `ctx.runtime`.

**Run / Dispose** (internal):
Not separate methods. Running one engine operation and the acquire→release / invalidate-on-throw box lifecycle are *internal* to **execute**: it acquires the box, runs, releases on success or invalidates on throw (re-raising the same `SANDBOX_EXECUTION_TIMEOUT` / `MEMORY_ISSUE` / `LOG_SIZE_EXCEEDED` codes handlers already catch). Handlers no longer call `dispose`.

**Executor**:
The worker's live sandbox box (`RuntimeExecutorInfo`: sandboxId, boxId, pid, busy). Surfaced for health/observability. Not a synonym for Runtime.

**apiClient** (`WorkerToApiContract`):
The worker→app RPC surface, exposed **only over Socket.IO**, and held **only by the worker** — the **Sandbox** never has one. It carries the job lifecycle (`poll`, `completeJob`, `extendLock`), the **Resolver**'s fetches (`getFlowBundle`, `getPiece`, `getPieceArchive`, `getFlowVersion`, `disableFlow`, …), and `uploadRunLog` — the worker's own terminal-state report (see **Run-time callbacks**). It no longer carries the live progress callbacks; the engine sends those to the app directly.

**Run-time callbacks**:
The calls a run emits to the app *during* execution: `updateRunProgress`, `updateStepProgress`, `sendFlowResponse`, `uploadRunLog`. The **engine** posts all four to the app **directly over HTTP** (`internalApiUrl` + `engineToken`, the same channel it already uses for store/files/connections) — they do **not** travel back through the worker. App-side they live under `POST /v1/engine/*`, authorized as the `ENGINE` principal with `projectId` taken from the token. `uploadRunLog` is the one exception that is **dual-sourced**: the engine posts it for progress/terminal snapshots, and the **worker** also calls it over `apiClient` to record a terminal status the engine could not report itself (crash, OOM, `INTERNAL_ERROR`). Both entry points share one app-side handler. Because the engine forks in-process inside the worker, it reaches the app over the worker's own app URL; no separate channel is needed.

**Flow Bundle**:
A per-locked-flow-version artifact (frozen piece manifest + compiled code) stored in S3/DB. The **Resolver** uses it as the fast path (resolve from the manifest instead of re-fetch-and-compile); on a miss it builds and publishes the bundle to S3 itself, then passes the ref into `execute.provision`. The **Sandbox** only ever consumes a ready bundle — it pulls the blob from S3 and never builds one. (Distinct from **Piece Bundle**.)

**Piece Bundle**:
The installable `.tgz` for a single piece `name@version`, addressed as a **link** — every piece type resolves to one downloadable URL, never to bytes over the worker socket. The Sandbox downloads the link directly and installs the tarball; it no longer branches on registry-vs-archive. The link is produced by an engine-token endpoint and can be backed by **whatever is available**: a signed-S3 object when present, the npm tarball for an official piece, or the app's **file store served directly** ("served from file") — so a working link always exists even with no S3 configured. S3 copies of official tarballs are populated **lazily**: a miss serves the piece another way (npm/file) and enqueues a per-piece job to cache it in S3 for next time.
_Avoid_: piece archive (the old name for the custom-piece bytes fetched over the socket — now just one kind of Piece Bundle link).
