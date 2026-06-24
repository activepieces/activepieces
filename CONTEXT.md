# Activepieces — Execution Runtime

The vocabulary around *where and how a flow job is executed*: the worker, the sandbox pool, and the pluggable runtime that hosts the pool (local process vs. remote Cloud Run).

## Language

**Runtime**:
The pluggable seam that decides *where* each step of a job runs. Always driven by the worker through the lifecycle `createExecution → provision → run → dispose`. One implementation per **Runtime Kind**.
_Avoid_: executor (means something narrower — see Executor), backend, driver.

**Runtime Kind**:
The named deployment shape of the runtime, set by `AP_RUNTIME`: `LOCAL` (pool embedded in the long-lived worker at concurrency N) or `GCP_CLOUD_RUN` (pool hosted in a Cloud Run container, reached over HTTP). The execution path is identical across kinds; only where the pool is hosted differs.

**Sandbox Pool** (or **Pool**):
The component that materializes dependencies into a cache and runs engine operations in sandbox child processes. Created by `createSandboxPool`. The same pool code runs under every Runtime Kind.
_Avoid_: sandbox manager (that is one slot inside the pool), worker.

**Cloud Run Runtime**:
The `GCP_CLOUD_RUN` runtime. The worker stays in place as the job *puller* (poll the queue → `POST /execute` → `completeJob`), but the heavy work happens in a Cloud Run container hosting the pool at concurrency 1 on ephemeral disk. The container **opens its own Socket.IO `apiClient` to the app** for provision-fetches and runs the whole `provision → run → dispose` lifecycle internally. The four **run-time callbacks** never ride the container's `apiClient` — the engine posts them straight to the app over HTTP, identically to the `LOCAL` runtime. The worker's runtime impl is a thin HTTP client.

**Pool Server**:
The single `/execute` HTTP endpoint the Cloud Run image runs. One self-contained call: job-in → result-out (Cloud Run cannot guarantee request affinity across separate calls, so the lifecycle cannot be split over the wire). Backed by the same `createSandboxPool` plus the container's own `apiClient`.

**Provision**:
The first lifecycle step: resolve flow/piece/code dependencies, materialize them into the cache, and reserve a sandbox slot. Returns the resolved `flowVersion` (the worker embeds it into the engine operation) or a `flow-not-found` / `disabled` outcome. Must not spawn the engine.

**Run**:
The lifecycle step that executes one engine operation in a sandbox and returns its `EngineResponse` plus logs.

**Dispose**:
Tear-down of an execution. `invalidate=true` discards the sandbox; `invalidate=false` releases it for reuse.

**Executor**:
A live sandbox slot inside the pool (`RuntimeExecutorInfo`: sandboxId, boxId, pid, busy). Surfaced for health/observability. Not a synonym for Runtime.

**apiClient** (`WorkerToApiContract`):
The worker→app RPC surface, exposed **only over Socket.IO**. It carries the job lifecycle (`poll`, `completeJob`, `extendLock`), the *provision-time fetches* (`getFlowBundle`, `getPiece`, `getFlowVersion`, …), and `uploadRunLog` — the worker's own terminal-state report (see **Run-time callbacks**). It no longer carries the live progress callbacks; the engine sends those to the app directly.

**Run-time callbacks**:
The calls a run emits to the app *during* execution: `updateRunProgress`, `updateStepProgress`, `sendFlowResponse`, `uploadRunLog`. The **engine** posts all four to the app **directly over HTTP** (`internalApiUrl` + `engineToken`, the same channel it already uses for store/files/connections) — they do **not** travel back through the worker. App-side they live under `POST /v1/engine/*`, authorized as the `ENGINE` principal with `projectId` taken from the token. `uploadRunLog` is the one exception that is **dual-sourced**: the engine posts it for progress/terminal snapshots, and the **worker** also calls it over `apiClient` to record a terminal status the engine could not report itself (crash, OOM, `INTERNAL_ERROR`). Both entry points share one app-side handler. Because the engine reaches the app the same way under every **Runtime Kind**, no channel back to the worker is needed.

**Flow Bundle**:
A per-locked-flow-version artifact (frozen piece manifest + compiled code) stored in S3/DB, fetched as the fast path during provision so the pool can skip resolve-and-compile.
