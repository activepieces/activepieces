# The Cloud Run Pool Server: a dedicated /execute image with a self-contained envelope

The `GCP_CLOUD_RUN` runtime is implemented as a **Pool Server**: a dedicated, minimal container image (bun + isolated-vm + isolate + the built engine + `sandbox-pool`) whose entrypoint (`sandbox-pool/src/server/main.ts`) runs `createSandboxPool({ concurrency: 1 })` behind a single HTTP `POST /execute` (+ `GET /health`). The worker's `cloud-run-runtime.ts` implements the `Runtime` seam as a thin HTTP client of that endpoint; `getActiveExecutors()` returns `[]` and `shutdown()` is a no-op. Builds on ADR 0001 (Cloud Run is the pool at concurrency 1) and ADR 0002 (pieces are links, fetched by the pool over HTTP).

## The /execute contract

- **Request body** (everything the remote pool needs — it has no app connection): `{ operationType, operation, timeoutInSeconds, provision, settings }`. `workerIndex`/`log` are dropped (the remote pool is concurrency-1 with its own logger). `settings` (`SandboxPoolSettings`) is sent **per request** so Cloud Run needs zero execution config and always matches the platform; the server stashes it request-scoped (safe at concurrency 1) and the pool's `getSettings()` returns it.
- **Response envelope:** `{ ok: true, result }` on success, or `{ ok: false, errorCode, params }` when `pool.execute` throws. The client reconstructs `new ActivepiecesError({ code: errorCode, params })` and throws it, so the worker's handlers branch on `SANDBOX_EXECUTION_TIMEOUT` / `MEMORY_ISSUE` / `LOG_SIZE_EXCEEDED` (and page on-call) exactly as for `LOCAL`. Non-`ActivepiecesError` throws map to a generic code → `INTERNAL_ERROR`.
- **Auth:** Cloud Run `--allow-unauthenticated`; a shared-secret `AP_POOL_SERVER_TOKEN` (env on both sides) checked by the server as a Bearer header. The worker finds the service via `AP_POOL_SERVER_URL`.

## Failure & timeout

The worker's `fetch` timeout is `FLOW_TIMEOUT_SECONDS + buffer` (mirrors the in-process sandbox timeout); `extendLock` keeps the BullMQ job alive while `/execute` runs. Any failure (timeout, dropped connection, 5xx, cold-start failure) **throws — no HTTP-layer retry** — and surfaces as `INTERNAL_ERROR`; BullMQ's existing job-level retry decides whether to re-dispatch a fresh job. This is safe because the engine posts progress/`sendFlowResponse`/logs directly to the app (ADR 0001), so a failed call never corrupts state — at worst the run is failed and retried, identical to a worker crash. A silent HTTP retry is rejected: the client can't know whether the engine already ran side effects, so it could double-execute.

## Why

- **Dedicated minimal image** (vs reusing the full app/worker image with a boot mode): keeps the Cloud Run surface to exactly pool + engine + isolate, no app/poller/apiClient.
- **Per-request settings** (vs Cloud Run env): no config drift, expresses per-platform values (SSRF list, dev pieces) the app already resolved.
- **Shared-secret auth** (vs GCP IAM/OIDC): host-agnostic and simple; the trade-off is a long-lived secret to rotate.
- **Server in `sandbox-pool`** (vs a separate package): pool + server ship as one unit; the request/response envelope types are exported from `sandbox-pool` so the worker client and the server share one contract.

## Consequences

- Cloud Run must be pinned to **concurrency 1**; the request-scoped settings stash and single-manager pool assume one in-flight `/execute` per instance.
- Cloud Run request timeout must be ≥ `FLOW_TIMEOUT_SECONDS` (Cloud Run max is 60 min, bounding the longest synchronous flow on this runtime).
- A `GCP_CLOUD_RUN` worker reports no sandboxes to the app healthcheck (they live on the Pool Server).
- **The pool cache must be on ephemeral *disk*, not RAM.** The Pool Server's `basePath` comes from `CACHE_BASE_PATH`; on Cloud Run it must point at a disk-backed ephemeral mount and the service must be configured for ephemeral-disk storage — **not** the default memory-backed `tmpfs`/`/tmp`. Piece installs + compiled code + the engine bundle are large and would otherwise consume the instance memory budget and risk OOM. Warm instances reuse this disk cache across sequential requests (with `REUSE_SANDBOX=true` from per-request settings).
- **Second-generation execution environment is required.** Ephemeral disk is gen2-only (gen1's filesystem is RAM-backed `tmpfs` that counts against the memory limit), so the disk-cache decision above forces gen2. The Pool Server runs **`SANDBOX_CODE_ONLY` only** (node child process + `isolated-vm`, no isolate binary / namespaces / cgroups), so gen1's restricted syscalls were not the deciding factor — the disk requirement was. Gen2's slower cold start is accepted and mitigated by keeping min-instances warm and reusing the per-instance disk cache; gen1's faster scaling is rejected because a RAM-backed piece cache competes with execution for memory and risks OOM.
