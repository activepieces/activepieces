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

**Nothing caps engine memory except** `--max-old-space-size`**.** isolate enforces no memory limit — we pass neither `--mem` nor `--cg-mem` — so the node flag is the only bound. `isolate.ts` used to drop `resourceLimits` on the floor (it destructured only `sandboxId, mounts, env`), which meant that in both isolate modes the engine ran with V8's *default* heap and `SANDBOX_MEMORY_LIMIT` was dead config. The same omission skipped `--expose-gc`, silently making the engine's 60s forced-GC loop in `worker-socket.ts` a no-op. Result: the engine outgrew its container and the kernel OOM killer SIGKILLed it — isolate reports only `SG: Caught fatal signal 9` — so the run surfaced as `SANDBOX_INTERNAL_ERROR` (pages on-call) instead of `MEMORY_LIMIT_EXCEEDED`. Fixed by a shared `engineNodeArgs()` used by both `fork.ts` and `isolate.ts`.

**Headroom belongs where the budget is *derived*, not where it's applied.** `--max-old-space-size` must sit below the container limit, because V8's old space is only part of RSS (new space, external buffers, isolated-vm heaps at 128 MB each, native allocations, plus the worker process itself). But the reserve must NOT be a blanket fraction inside the node-args helper: at the default `AP_WORKER_CONCURRENCY=5`, `SANDBOX_MEMORY_LIMIT` is an operator-configured number (default 1024 MB) with no relationship to container size, so shaving 25% off it just steals working memory from self-hosters who had no problem. The reserve lives in `sandbox-config.ts` `primeFullContainerMemory()` — the concurrency-1 path that derives the budget *from* `memory.max`, and the only place where 100% is provably unusable. An explicit `SANDBOX_MEMORY_LIMIT` is honored exactly.

`--no-node-snapshot` **is mandatory wherever isolated-vm loads** (isolated-vm#424) — that means the isolate path too, since `SANDBOX_CODE_AND_PROCESS` runs code steps in isolated-vm *inside* the isolate sandbox.
