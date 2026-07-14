# Transitional multi-box concurrency: honor AP_WORKER_CONCURRENCY for backward compatibility

---
Status: accepted (amends, does not supersede, ADR 0003)
---

ADR 0003 collapsed the worker and sandbox into one unit at **concurrency 1**, scaling
horizontally by replicas. That is still the destination. But shipping concurrency-1-only would
silently drop existing `AP_WORKER_CONCURRENCY=N` deployments to 1/N of their per-container
throughput overnight. So we re-introduce a **transitional compatibility mode**: a worker honors
`AP_WORKER_CONCURRENCY=N` by running **N poll loops** over **N in-process sandbox boxes** in one
container (`createSandboxRuntime({ concurrency })` holds an array of boxes; `execute` routes each
job to its box by `workerIndex`). The default is restored to **5** — `main`'s historical value — so
the default deployment preserves the old multi-box behavior exactly. This is the only entry point
(the `pool`/`createSandboxPool` vocabulary stays dead) and Cloud Run / `RuntimeKind` stay deleted.

## Why this is temporary

This restores exactly what ADR 0003 deleted, so it must not become the architecture. The destination
is still concurrency 1 + replicas. Because the default (5) *is* this mode, a per-deployment startup
warning would fire for everyone and tell us nothing — so the deprecation/cutover signal is deferred
to the removal PR, which flips the default to 1, removes the box array + N poll loops, and ships the
user-facing breaking notice. (Earlier draft used a startup `warn` at `N>1`; that only made sense
when the default was 1.)

## Consequences

- **OOM blast radius inverts at N>1.** N engine children share one container cgroup, so a single
  runaway flow can OOM-kill the container and take down **all N in-flight jobs**, not one — exactly
  the shared-cap ratchet ADR 0003 removed. We **document only**: the 0.5 CPU / 1 GB cap is sized for
  concurrency 1; operators running N must size the container ~N× themselves (the same expectation
  they had before ADR 0003). No per-box memory partitioning is built for a mode being deleted.
- **Provision concurrency is already safe.** The on-disk cache layer (`piece-installer`,
  `engine-installer`, flow-bundle-store, code-cache) is the same code `main` ran with N boxes
  provisioning concurrently (`threadSafeMkdir`, `cache-state`), so no new per-key dedup is needed.
