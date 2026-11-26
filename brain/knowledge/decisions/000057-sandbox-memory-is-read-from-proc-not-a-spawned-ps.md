---
status: accepted
icon: 🧮
---

# Sandbox memory is read from /proc, not a spawned ps

## Decision

`systemUsage.getProcessTreeMemoryBytesByPids` builds the process table by listing `/proc` and reading each `/proc/<pid>/stat` for the parent pid. It no longer spawns `ps` through `pidtree`, and the `pidtree` dependency is removed. `pidusage` still reads the memory of each pid.

## Context

The number was only sampled every 15 seconds for the workers page, where the cost of a spawn did not matter. `AP_RECYCLE_SANDBOX_AT` put the same read on the job path: with the variable set, the worker measures the reused sandbox before every job to decide whether to replace it.

## Why

Measured in a `--cpus 0.5 --memory 1g` container from the worker image, 40 reads per mode, both methods returning the same pids and the same memory:

| | `/proc` median / p90 / max | `ps` median / p90 / max |
| --- | --- | --- |
| Idle | 2.1 / 2.8 / 3.8 ms | 10.8 / 11.7 / 13.2 ms |
| CPU-throttled | 2.2 / 3.1 / 58.2 ms | 10.4 / 74.7 / 93.5 ms |

Almost all of the `ps` time is starting a process, and a new process needs its own CPU time from the container's quota, so it is what stretches under CFS throttling. Reading files needs no new process.

Rejected: keeping `ps` and caching the last 15-second sample for the recycle check. A sandbox can grow by hundreds of MB in one run, so a stale sample would let it through. Also rejected: asking the engine for its own memory over the socket, which misses the code-step and Deno child processes that run beside it.

## Consequences

- `/proc` exists only on Linux. On macOS the scan fails and every pid reports 0 through the existing error path, so sandbox memory reads 0 on a Mac dev machine and the recycle check never fires there. Restoring it means a `ps` fallback behind a platform check.
- We own the `stat` parsing. The process name field can contain spaces and parentheses, so the parent pid is taken from after the last `)`, never by splitting the whole line.
- A process that exits between the listing and the read is skipped, not treated as an error.
