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
