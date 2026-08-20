---
status: accepted
---

# The engine heap is clamped to the container, even when the operator configured more

## Decision

The worker derives an engine heap ceiling from its own cgroup limit — `(container − 320 MB reserve) / AP_WORKER_CONCURRENCY` — and clamps `SANDBOX_MEMORY_LIMIT` to it. The value is only ever **lowered**: one that already fits is honoured exactly, and when nothing caps the process there is no container budget to divide, so the operator's number stands untouched. This **amends** "Worker is the Sandbox", which said an explicit `SANDBOX_MEMORY_LIMIT` is honoured exactly — it is now honoured exactly *up to* what the container can actually hold.

## Context

`SANDBOX_MEMORY_LIMIT` arrives from the app knowing nothing about the container. Its 1024 MB default filled a 1 GiB cgroup on its own, while the worker in that same container holds 200–230 MB, so the ceilings summed past the cgroup. That ADR already named the reserve as belonging in `sandbox-config.ts`, but the code never subtracted one: `primeFullContainerMemory()` set the limit to the *full* container and was later deleted outright.

## Why

The reason is diagnosability, not memory. With the engine's ceiling at or above the container's, **V8's emergency threshold sits above the kernel's**, so the process is always SIGKILLed before it can abort — reaching `handleProcessExit` as the ambiguous `Caught fatal signal 9` branch, which reports `MEMORY_LIMIT_EXCEEDED` with no V8 diagnostic and no failed step, at a threshold that floats with whatever the worker holds. Measured in a 1 GiB container beside a 260 MB sibling: at `1024` the child dies at heapUsed 784 MB, exit 137, zero V8 output; at `600` the same workload exits 134 with a full `JavaScript heap out of memory` stack. The rejected alternative was to keep honouring the configured value exactly and fix this by sizing containers — rejected because raising the cgroup only moves the wall (1 GiB → 1.5 GiB moved the median victim from ~1008 MB to ~1520 MB and the kills continued), and because it leaves every self-hoster on the same silent failure.

## Consequences

Breaking for anyone relying on the `1048576` default in a container under ~1.4 GB: the effective heap drops below 1024 MB. That ceiling was never reachable — the kernel killed the process first — but flows sitting just under it may now surface a clean `MEMORY_LIMIT_EXCEEDED` where they previously failed at random. The fix is to size the container as `desired heap + 320 MB`.

- Trust in a cgroup reading is interface-dependent; see the Workers page for which one can say "unconstrained" and which cannot.
- The ceiling is derived purely and published only by the current connection generation, so an abandoned reconnect cannot install a stale one.
- This addresses only the engine side. The worker's own per-run spike is a separate defect and remains the victim in ~99.65% of kernel OOM kills.
