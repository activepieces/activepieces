# Workers Module

## Summary
Workers are separate Node processes that poll the app for jobs and execute flows/triggers in sandboxes. They connect to the app over a Socket.IO channel: on connect a worker fetches its runtime settings (`WorkerSettingsResponse`) and the app registers an RPC server (`WorkerToApiContract`) for that socket. Jobs are pulled by the worker via `poll()` rather than pushed. A worker advertises liveness and config through `MachineInformation` (heartbeat), whose `workerProps` carry its identity including `version`. In the default Docker image both `activepieces-app` and `activepieces-worker` run under PM2 from `WORKDIR /usr/src/app`; `AP_CONTAINER_TYPE` (`APP` / `WORKER` / `WORKER_AND_APP`) selects which start.

## Key Files
- `packages/server/api/src/app/workers/machine/machine-controller.ts` — Socket.IO listeners (`FETCH_WORKER_SETTINGS`, `DISCONNECT`); registers the RPC server per connection
- `packages/server/api/src/app/workers/machine/machine-service.ts` — `onConnection` / `onDisconnect`, `buildSettingsResponse` (emits `APP_VERSION`), worker listing
- `packages/server/api/src/app/workers/rpc/worker-rpc-service.ts` — `createHandlers()`: `poll` (with version gate), `completeJob`, `extendLock`, progress/log RPCs
- `packages/server/worker/src/lib/worker.ts` — worker lifecycle (`worker.start/stop`), `pollAndExecute` loop (with version gate), `getWorkerProps`
- `packages/server/worker/src/lib/config/worker-settings.ts` — caches the `WorkerSettingsResponse` fetched on connect
- `packages/server/utils/src/ap-version.ts` — `apVersionUtil.getCurrentRelease()`; both sides read the deploy-root `package.json` version
- `packages/shared/src/lib/automation/workers/index.ts` — `WorkerProps`, `MachineInformation`, `WorkerSettingsResponse`, `WorkerToApiContract` contracts

## Edition Availability
- Community / Enterprise / Cloud: all editions run workers; topology differs (embedded `WORKER_AND_APP` for self-host single-container vs dedicated worker fleets on Cloud).

## Domain Terms
- **`WorkerProps`** — typed worker identity sent in every heartbeat (`EXECUTION_MODE`, `WORKER_CONCURRENCY`, `SANDBOX_MEMORY_LIMIT`, `REUSE_SANDBOX`, `version`). Previously a free-form `Record<string,string>`.
- **`WorkerSettingsResponse`** — runtime config the app hands a worker on connect; now includes `APP_VERSION` (the app's release).
- **`connectionGeneration`** — worker-side counter bumped on every disconnect; in-flight poll loops exit when their captured generation goes stale, so a reconnect starts fresh loops.
- **version gate** — both sides refuse to exchange jobs when worker release ≠ app release (see below).

## Connection & Poll Flow
1. Worker connects → emits `FETCH_WORKER_SETTINGS`; app's `machineService.onConnection` returns `WorkerSettingsResponse` (incl. `APP_VERSION`) and registers `createHandlers` for the socket.
2. Worker caches settings and spawns `concurrency` `pollAndExecute` loops.
3. Each loop calls `apiClient.poll(machineInfo)`; the app's `poll` handler returns the next job for the worker's queue, or `null`.
4. On job: worker executes in a sandbox, periodically `extendLock`, then `completeJob`.
5. On disconnect, `connectionGeneration++` stops the loops; Socket.IO auto-reconnects and the cycle repeats.

> **Payload resolution is engine-side, not worker-side.** Jobs carry a `JobPayload` (`inline` value or `ref` `fileId`). The worker forwards it unchanged into the engine operation; the engine hydrates a `ref` via the file-download path (direct bytes or an S3 signed-link redirect). There is no worker→API payload-fetch RPC — the contract exposes no `getPayloadFile`.

## Version Gating (rolling-deploy safety)
During a rolling upgrade the app and worker fleets briefly run different builds. Mixing them risks flow-schema/contract skew and silent run corruption, so dispatch is gated on an exact release match — both sides enforce it, whichever runs the newer build:
- **App side** (`worker-rpc-service.ts#poll`): if `input.workerProps.version !== apVersionUtil.getCurrentRelease()`, it logs a warning and returns `null` (withholds the job). An old worker can never receive jobs from a new app.
- **Worker side** (`worker.ts#pollAndExecute`): if the connected app's `APP_VERSION !== AP_VERSION`, it pauses polling (`VERSION_MISMATCH_POLL_PAUSE_MS`, 10s) and retries. A new worker won't pull from an old app.
- **Recovery** is automatic: once both fleets converge on the same release, polling resumes on the next cycle — no restart needed.
- **Version source**: `apVersionUtil.getCurrentRelease()` reads `process.cwd()/package.json`, which is the deploy-root release version (e.g. `0.83.0`) for both processes under PM2 — not a workspace `package.json`. On read failure it falls back to `0.0.0` symmetrically, so a misconfigured-but-identical pair still matches.
