---
status: accepted
---

# Worker is the Sandbox: one job per worker, scale by replicas

## Decision
The worker and sandbox collapse into one unit. A worker polls one job (concurrency 1), resolves it, and runs the engine in its in-process box (node child + isolated-vm). No separate sandbox container, no `/execute` hop, no Docker socket, no pool. Parallelism is horizontal: N worker replicas, each capped 0.5 CPU / 1 GB.

## Context
Superseded a short-lived LOCAL_POOL / GCP_CLOUD_RUN exploration (worker-as-pool-manager over HTTP), which needed a Docker socket and a remote HTTP boundary.

## Why
Removes the Docker-socket requirement (the biggest risk in the prior model) — self-hosting is just "scale workers", which is how AP already scales. One capped container per job means an OOM kills exactly one worker; the shared-heap ratchet from reusing in-process slots can't happen across jobs. One execution path = far less code: no seam, no remote transport, no provisioner, no HTTP envelope to keep in sync.

## Consequences
Throughput = replica count. The worker image must carry the execution toolchain (engine + isolated-vm + bun + esbuild); kept small via an esbuild single-file bundle and a lazy-loaded chat agent. No Cloud Run target for now — re-adding a remote host reintroduces an HTTP boundary. POC status: verified via docker-compose, not yet a hardened production image.

## Gotchas

**`SANDBOX_MEMORY_LIMIT` only reaches the engine if the process maker applies it.** The limit is *not* enforced by isolate or by any cgroup we set — the only thing that caps the engine is `--max-old-space-size` on the node command line. `isolate.ts` used to drop `resourceLimits` on the floor (it destructured only `sandboxId, mounts, env`), so in both isolate modes the engine ran with V8's default heap *and* no `--expose-gc`, meaning the engine's 60s forced-GC loop in `worker-socket.ts` was silently dead too. Result: the engine outgrew the container and the cgroup OOM killer SIGKILLed it — isolate prints `SG: Caught fatal signal 9` — instead of the run failing as `MEMORY_LIMIT_EXCEEDED`. Fixed by a shared `engineNodeArgs()` used by both `fork.ts` and `isolate.ts`.

**Don't set `--max-old-space-size` to 100% of the memory budget.** At concurrency 1, `sandbox-config.ts` sets `SANDBOX_MEMORY_LIMIT` to the *entire* container limit. V8's old space is only part of RSS (new space, external buffers, isolated-vm heaps at 128 MB each, native allocations, plus the worker process itself all sit outside it), so capping old space at the full budget guarantees the cgroup OOM killer wins the race against V8's own graceful heap-OOM. `engineNodeArgs()` reserves 25% headroom so V8 aborts first — a graceful heap error is classified `SANDBOX_MEMORY_ISSUE` and fails just the run.

**`--no-node-snapshot` is mandatory wherever isolated-vm loads** (isolated-vm#424) — that means the isolate path too, since `SANDBOX_CODE_AND_PROCESS` runs code steps in isolated-vm *inside* the isolate sandbox.
