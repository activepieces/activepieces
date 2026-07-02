# The worker is the sandbox: one job per worker, scale by replicas

The worker and the sandbox collapse into **one unit**. A worker polls **one** job at a time
(concurrency 1), resolves it, and runs the engine in its **in-process** sandbox box
(`SANDBOX_CODE_ONLY`: a node child + `isolated-vm`). There is no separate sandbox container, no
`/execute` HTTP hop, no Docker socket, no pool. Parallelism is **horizontal**: the operator runs N
worker replicas, each its own container capped at **0.5 CPU / 1 GB**. This supersedes the short-lived
`LOCAL_POOL` / `GCP_CLOUD_RUN` exploration (worker-as-pool-manager over HTTP), which is removed.

## What this deletes

- The pluggable `Runtime` seam's multiple kinds, `runtime-factory`, and the `RuntimeKind` enum.
- `cloud-run-runtime` + `cloud-run-provisioner` (GCP REST provisioning) and `google-auth-library`.
- `local-pool-runtime` + `docker-provisioner` + `dockerode` (worker-spawns-containers).
- `sandbox-http-client` and the sandbox `/execute` HTTP server (`sandbox/src/server/main.ts`) with its
  `ExecuteRequest`/`ExecuteResponse` wire contract.
- The in-process multi-slot pool (already reduced to a single box earlier): the worker now calls
  `createSandboxRuntime` directly and pins concurrency to 1.

The `@activepieces/sandbox` package stays — it is the in-process box (cache, sandbox-manager, fork /
isolate, resolver). It is imported and run by the worker, not shipped as its own container.

## Why

- **Removes the Docker-socket requirement** the `LOCAL_POOL` model needed — the worker no longer drives
  the Docker daemon, so there is nothing privileged to mount and the self-hosting story is just "scale
  workers", which is how Activepieces already scales. (This was the biggest risk in the prior model.)
- **Memory isolation without a pool:** one capped container per job means an OOM or runaway flow kills
  exactly one worker; the orchestrator (k8s/compose) restarts it. The shared-heap ratchet that came
  from reusing in-process slots cannot happen across jobs — the blast radius is a single run.
- **One execution path, less code:** no seam, no remote transport, no provisioner, no shared secret, no
  HTTP envelope to keep in sync. Resolve → fork engine → complete, all in one process.

## Consequences

- **Throughput is replica count.** A box at 0.5 CPU / 1 GB runs one flow at a time; capacity scales by
  adding workers, sized by the orchestrator. `AP_WORKER_CONCURRENCY` defaults to 1 and the worker runs a
  single poll loop regardless.
- **The worker image must carry the execution toolchain** (engine bundle + `isolated-vm` + `bun` +
  `esbuild`) plus the worker's own deps — including the heavy `ai-sdk` cluster behind the chat agent. To
  keep it small: the worker entry is **esbuild-bundled into one file** (`Dockerfile.worker`, multi-stage,
  **no workspace `node_modules`** in the final image, same trick as the engine), and the chat-agent
  handler is **lazy-loaded** (`import()` on first chat job) so its dependency graph never evaluates in a
  flow-only worker — keeping idle RSS small.
- **No Cloud Run target** for now. Re-adding a remote execution host would mean reintroducing an HTTP
  boundary; it is explicitly out of scope.
- **POC status:** verified locally via docker-compose (N worker replicas), not yet a published image or a
  hardened production deployment.
