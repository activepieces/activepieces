# Activepieces — Execution Runtime

The vocabulary around *where and how a flow job is executed*: the worker, the sandbox pool, and the pluggable runtime that hosts the pool (local process vs. remote Cloud Run).

## Language

**Runtime**:
The pluggable seam that decides *where* `execute` runs. Surface is `{ kind, execute(params), getActiveExecutors(), shutdown() }` — a single `execute` whose transport varies by **Runtime Kind** (in-process for `LOCAL`, `POST /execute` for `GCP_CLOUD_RUN`). It does **not** resolve dependencies; that is the **Resolver**'s job, done before `execute`. (Supersedes the old `createExecution → provision → run → dispose` triad.)
_Avoid_: executor (means something narrower — see Executor), backend, driver.

**Runtime Kind**:
The named deployment shape of the runtime, set by `AP_RUNTIME`: `LOCAL` (pool embedded in the long-lived worker at concurrency N) or `GCP_CLOUD_RUN` (pool hosted in a Cloud Run container, reached over HTTP). The execution path is identical across kinds; only where the pool is hosted differs.

**Sandbox Pool** (or **Pool**):
A **pure execution function**: given fully-resolved inputs it materializes them onto disk, mounts them, runs the engine operation in a sandbox child process, and returns the result. It holds **no `apiClient` and no app connection** — it never reaches back to the app. Its only outbound traffic is pulling the blobs named in its parameters (S3 by signed URL, npm registry for public pieces). The same pool runs under every Runtime Kind: in-process for `LOCAL`, behind the **Pool Server** for `GCP_CLOUD_RUN`.
_Avoid_: sandbox manager (that is one slot inside the pool), worker.

**Resolver**:
The role that turns a job into fully-materialized pool inputs — resolve the `flowVersion` and piece metadata, and produce a **ready (compiled) `flowBundle`**: on a cache hit, the existing S3 ref; on a miss, **compile the code, build the bundle, and publish it to S3** before handing back the ref (so it retains bun/build tooling). It disables the flow on a missing piece. **Always the worker** (it owns the only `apiClient`), under every Runtime Kind. All of this happens *before* `execute` is ever called, so the pool only ever sees healthy, complete, already-compiled inputs.

**Cloud Run Runtime**:
The `GCP_CLOUD_RUN` runtime. The worker stays in place as **Resolver + puller** (poll → resolve → `POST /execute` → `completeJob`); the Cloud Run container is **pure compute** — a concurrency-1 pool on ephemeral disk with no app connection. It receives everything it needs in the `/execute` body and pulls heavy blobs from S3/registry directly. The four **run-time callbacks** are emitted by the engine straight to the app over HTTP, identically to `LOCAL`. The worker's runtime impl is a thin HTTP client.

**Pool Server**:
The single `/execute` HTTP endpoint the Cloud Run image runs (exported from `sandbox-pool`, e.g. `startSandboxPoolServer`). One self-contained call: fully-resolved-job-in → result-out (Cloud Run cannot guarantee request affinity across separate calls, so the lifecycle cannot be split over the wire). Wraps the pure pool; holds no `apiClient`.

**execute**:
The pool's single entry point. Takes `{ operationType, operation, timeoutInSeconds, settings, provision }` where **`provision`** groups the resolved dependencies — `{ flowBundle?, pieces?: PiecePackage[], archiveRefs? }` — and returns `{ engineResponse, logs }`. `flowBundle` is the single reference that subsumes `flowVersion` + piece metadata + compiled codes (see **Flow Bundle**) — always a **ready, compiled** artifact (`{ url } | { inline manifest }`), never a build instruction, because the **Resolver** compiles before calling `execute`. It is passed for flow jobs, while piece-only jobs (`execute-property`, `execute-validation`, `extract-piece-info`) pass bare `pieces`. Private-piece archive bytes are *not* in the bundle (platform-shared, deduped) so they ride alongside as `archiveRefs` (S3). Replaces the old `provision → run → dispose` triad at the pool boundary: dependency *resolution* moved out to the **Resolver** (the `provision` object is its output), and reuse/teardown is internal. Identical signature for in-process (`LOCAL`) and over-HTTP (`GCP_CLOUD_RUN`) calls.

**resolve** (`Resolver.resolve`):
The **Resolver**'s single method, worker-side, kind-independent. Input `{ platformId, flow? , pieces? }` → `ResolveResult`: `{ kind: 'ready', provision, flowVersion? } | { kind: 'flow-not-found' } | { kind: 'disabled' }`. The handler branches on the outcome and, on `ready`, builds the engine operation from `flowVersion` before calling `execute`. Injected into the job context as `ctx.resolver` alongside `ctx.runtime`.

**Run / Dispose** (internal):
No longer methods on the seam. Running one engine operation and the acquire→release / invalidate-on-throw slot lifecycle are now *internal* to **execute**: it acquires a slot, runs, releases on success or invalidates on throw (re-raising the same `SANDBOX_EXECUTION_TIMEOUT` / `MEMORY_ISSUE` / `LOG_SIZE_EXCEEDED` codes handlers already catch). Handlers no longer call `dispose`.

**Executor**:
A live sandbox slot inside the pool (`RuntimeExecutorInfo`: sandboxId, boxId, pid, busy). Surfaced for health/observability. Not a synonym for Runtime.

**apiClient** (`WorkerToApiContract`):
The worker→app RPC surface, exposed **only over Socket.IO**, and held **only by the worker** — the **Pool** never has one. It carries the job lifecycle (`poll`, `completeJob`, `extendLock`), the **Resolver**'s fetches (`getFlowBundle`, `getPiece`, `getPieceArchive`, `getFlowVersion`, `disableFlow`, …), and `uploadRunLog` — the worker's own terminal-state report (see **Run-time callbacks**). It no longer carries the live progress callbacks; the engine sends those to the app directly.

**Run-time callbacks**:
The calls a run emits to the app *during* execution: `updateRunProgress`, `updateStepProgress`, `sendFlowResponse`, `uploadRunLog`. The **engine** posts all four to the app **directly over HTTP** (`internalApiUrl` + `engineToken`, the same channel it already uses for store/files/connections) — they do **not** travel back through the worker. App-side they live under `POST /v1/engine/*`, authorized as the `ENGINE` principal with `projectId` taken from the token. `uploadRunLog` is the one exception that is **dual-sourced**: the engine posts it for progress/terminal snapshots, and the **worker** also calls it over `apiClient` to record a terminal status the engine could not report itself (crash, OOM, `INTERNAL_ERROR`). Both entry points share one app-side handler. Because the engine reaches the app the same way under every **Runtime Kind**, no channel back to the worker is needed.

**Flow Bundle**:
A per-locked-flow-version artifact (frozen piece manifest + compiled code) stored in S3/DB. The **Resolver** uses it as the fast path (resolve from the manifest instead of re-fetch-and-compile); on a miss it builds and publishes the bundle to S3 itself, then passes the ref into `execute.provision`. The **Pool** only ever consumes a ready bundle — it pulls the blob from S3 and never builds one.
