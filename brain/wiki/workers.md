# Workers

Separate Node processes that poll the app for jobs and execute flows/triggers. **The worker *is* the sandbox**: each forks the engine in-process via `@activepieces/sandbox` (`createSandboxRuntime`) — no separate sandbox pool. Destination model is one box per worker (`concurrency 1`), scaling out horizontally with small-capped replicas so an OOM kills one job, not a shared pool. A transitional mode still honors `AP_WORKER_CONCURRENCY`.

The deep `Resolver`/`Runtime` concurrency and bundle-caching model lives on the **Execution Runtime** page — see it for provision/acquire/release, flow-bundle caching, and code-step build stubs.

### How it works
- Workers connect over Socket.IO; on connect they emit `FETCH_WORKER_SETTINGS`, get a `WorkerSettingsResponse` (incl. `APP_VERSION`), and the app registers an RPC server (`WorkerToApiContract`) per socket.
- Jobs are **pulled** via `poll()`, not pushed. Handing out a job moves it to BullMQ `active`, so the app records it under the polling `socket.id` (`jobAssignmentTracker`, keyed queue+jobId). Worker executes → periodic `extendLock` → `completeJob` clears the assignment.
- On disconnect, `connectionGeneration++` stops the loops; the app returns that socket's still-held jobs to the queue (`releaseConnectionJobs(socket.id)`) so they don't sit orphaned in `active` (the "Job stalled" storm); the worker aborts its in-flight runtime. Reconnect recreates the runtime fresh (kills any lingering job rather than colliding on the reused box).
- Graceful `stop()` (SIGTERM) drains in-flight jobs first (≤25s); the stalled-scan is the backstop for abrupt death.

### Config & routing
- `AP_CONTAINER_TYPE` (`APP` / `WORKER` / `WORKER_AND_APP`) picks what starts under PM2. `AP_REUSE_SANDBOX` reuses the engine process between jobs.
- **Worker groups** (`AP_WORKER_GROUP_ID` + `AP_PROJECT_WORKER`) — one routing primitive; the flag, not a prefix, encodes scope. `AP_PROJECT_WORKER=true` (default) → project scope, polls `project-<label>-jobs`, routes only `EXECUTE_FLOW`/`EXECUTE_WEBHOOK`. `false` → platform scope, polls `platform-<id>-jobs`, routes all job types. Empty id = shared queue. Per-project routing is EE, gated behind `platform_plan.workerGroupsEnabled`.
- `concurrency === 1` primes the sandbox to the full container RAM (cgroup-aware) via `primeFullContainerMemory()`.

### Gotchas
- **Version gate (rolling-deploy safety)**: dispatch requires an exact release match, enforced both sides via `versionsAreCompatible` (fail-closed — `undefined` or `UNKNOWN_VERSION` `'0.0.0'` is treated incompatible). App withholds jobs from a mismatched worker (`poll` returns null); worker pauses polling 10s. Ordinary mismatch self-heals on convergence; a read failure does not (cached for process life) and pages on-call once at startup via `assertReleaseReadable`.
- Version source is `process.cwd()/package.json` (deploy-root), not a workspace file. Two failed reads are treated incompatible on purpose (not "same release").
- Payload resolution is engine-side: jobs carry a `JobPayload` (`inline` or `ref` fileId), forwarded unchanged; there is no worker→API payload-fetch RPC.
- Observability: `GET /v1/health/system` returns a `release` block (skew across connected workers); `/v1/worker-machines/queue-metrics` (all editions) feeds KEDA autoscaling.

### Key files
Entry point: `worker`, the exported lifecycle object in `worker.ts`; `worker.start(...)` is wired up in the worker process main.

- `packages/server/worker/src/lib/worker.ts` — worker lifecycle, the `pollAndExecute` loop, version gate, in-flight drain
- `packages/server/worker/src/lib/config/` — worker env vars and the cached `WorkerSettingsResponse`
- `packages/server/worker/src/lib/runtime/` — bridges worker settings to sandbox settings, primes full container memory
- `packages/server/sandbox/src/lib/` — the `@activepieces/sandbox` library: `Runtime` / `Resolver`, caches, piece install, type contracts
- `packages/server/api/src/app/workers/machine/` — Socket.IO listeners, machine service, worker-machine and queue-metrics routes
- `packages/server/api/src/app/workers/rpc/` — app-side RPC handlers: `poll`, `completeJob`, `extendLock`, flow-bundle calls
- `packages/server/api/src/app/workers/job-queue/` — job assignment tracker and queue routing
- `packages/core/execution/src/lib/workers/` — `WorkerProps`, `MachineInformation`, `WorkerSettingsResponse`, `WorkerToApiContract`
- `packages/server/utils/src/ap-version.ts` — `getCurrentRelease()` and `versionsAreCompatible()`

Paths verified 2026-07-17. An earlier version pointed at `packages/core/shared/src/lib/automation/workers/`; it moved to `packages/core/execution/src/lib/workers/`.
