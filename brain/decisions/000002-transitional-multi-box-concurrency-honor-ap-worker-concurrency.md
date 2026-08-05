---
status: accepted
---

# Transitional multi-box concurrency (honor AP_WORKER_CONCURRENCY)

## Decision

A worker honors `AP_WORKER_CONCURRENCY=N` by running N poll loops over N in-process sandbox boxes in one container: `createSandboxRuntime({ concurrency })` holds the array of boxes, and `execute` routes each job to its box by `workerIndex`. Default restored to 5 (main's historical value), so the default deployment preserves the old multi-box behavior exactly. Amends, does not supersede, "Worker is the Sandbox".

## Context

"Worker is the Sandbox" collapsed worker+sandbox at concurrency 1 and scaled by replicas, and that is still the destination. But shipping concurrency-1-only would silently drop existing `AP_WORKER_CONCURRENCY=N` deployments to 1/N of their per-container throughput overnight.

## Why

A backward-compat bridge toward the concurrency-1 destination. It restores exactly what "Worker is the Sandbox" deleted, so it must not become the architecture. Because the default (5) *is* this mode, a per-deployment startup warning would fire for everyone and tell us nothing, so the deprecation/cutover signal is deferred to the removal PR, which:

- flips the default to 1
- deletes the box array and the N poll loops
- ships the user-facing breaking notice

## Consequences

OOM blast radius inverts at N&gt;1: the N engine children share one container cgroup, so a single runaway flow can OOM-kill the container and take down all N in-flight jobs. That is the shared-cap ratchet "Worker is the Sandbox" removed.

- Documented only: the 0.5 CPU / 1 GB cap is sized for concurrency 1, so operators running N must size the container \~N times themselves.
- Provision concurrency is already safe: the on-disk cache layer is the same code `main` ran with N boxes.
- Temporary by design. Must not become the architecture.
