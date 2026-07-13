# Graceful memory budget below the container OOM ceiling

---
Status: accepted (refines ADR 0004 / ADR 0003 for the concurrency-1 destination)
---

ADR 0003/0004 frame the concurrency-1 model's failure mode as: a runaway flow OOM-kills the worker
container, blast radius one job, and the orchestrator restarts it. We refine that — the container
crash should be the *last* resort, not the *first*. The engine child already runs under a V8
`--max-old-space-size` heap cap (from `SANDBOX_MEMORY_LIMIT`); when it trips, V8 aborts with a
recognizable stderr banner that the sandbox classifies as `SANDBOX_MEMORY_ISSUE` →
`FlowRunStatus.MEMORY_LIMIT_EXCEEDED` — a graceful, non-paging, non-retrying terminal state, worker
survives, box recycled. We make that layer actually reachable by (a) wiring the same
`--max-old-space-size` into isolate execution modes, which previously ignored `resourceLimits`
entirely (no memory bound at all), and (b) subtracting headroom (`max(256 MB, 15%)` of container RAM)
from the concurrency-1 full-container memory override so V8 aborts *just under* the cgroup limit
rather than the orchestrator OOM-killing the container first.

## Consequences

- **Lower effective ceiling in exchange for graceful failure.** At concurrency 1 a run now fails
  alone at ~85% of container RAM (clear `MEMORY_LIMIT_EXCEEDED`, no oncall page, no job retry)
  instead of crashing the whole container at 100% (worker restart, `INTERNAL_ERROR`-shaped incident).
  The ~15% headroom is deliberately unused capacity — the price of the guarantee.
- **Detection is heuristic, not contractual, in isolate mode.** Classification depends on
  `handleProcessExit` recognizing the OOM via the stderr banner / `code===134` / `SIGABRT` /
  unexplained `SIGKILL`. The isolate wrapper can launder the inner process's exit code/signal, so the
  isolate-mode graceful budget is **verification-gated**: confirmed on a real isolate host before it
  is relied upon. Identified fallback if the heuristic misses: parse `isolate`'s `--meta` `exitsig`.
- **Unchanged at `AP_WORKER_CONCURRENCY>1`.** The transitional multi-box mode keeps the
  server-provided per-child `SANDBOX_MEMORY_LIMIT` (no full-container override, so no headroom
  subtraction applies); ADR 0004's "operators must size the container ~N× themselves" still stands.
