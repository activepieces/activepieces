# Worker Runtime — Context Glossary

Canonical terms for the worker package. Glossary only — no implementation details.

The shared execution-runtime vocabulary (**Worker**, **Runtime**, **Sandbox**, **Resolver**,
**execute**, **Flow Bundle**, **Piece Bundle**) is defined once in the **root `CONTEXT.md`** — this
file does not restate it. Below are only the terms specific to how the worker process *hosts* that
runtime. The post-ADR-0003/0004 model is: the worker is the sandbox, runs the engine in-process, and
scales by replicas; a transitional mode honors `AP_WORKER_CONCURRENCY=N` with N in-process boxes.

## Terms

### Poll Loop
The worker's job-acquisition loop: pull a job from the app over the socket, resolve it, run it in a
box, report the result, repeat. The destination runs **one** poll loop (concurrency 1). In the
transitional compatibility mode the worker runs **N** poll loops (one per `workerIndex`), each bound
to its own box, sharing the socket, the version gate, and the `polling` / `connectionGeneration`
state. Default is 5 (see root **Worker**, ADR 0004).

### Warm / Stateful Cache
The Execution Cache is **stateful and reused for the life of the worker process** — the first job of a
given kind pays the cold cost, later jobs hit the warm cache. There is **no pre-warming**: the cache
fills **lazily** on first use (piece install at provision time, Flow Bundle built on first execution
request). The old `PRE_WARM_CACHE` env var was removed; there is no toggle.

### Execution Cache
A content-addressed on-disk + in-memory store of materialized entries — one per `piece@version`, one
per `flowVersionId` Flow Bundle / compiled code — under `cache/v<n>` on the worker host. Owned by the
`@activepieces/sandbox` package, not the worker. Its keying, folder layout, locking, and `ready`-marker
validation are concurrency-safe (`threadSafeMkdir`, `cache-state`), so the N boxes of the transitional
mode share one cache safely.

### Version Gate
The worker↔app release-compatibility check run before every poll, via
`apVersionUtil.versionsAreCompatible`. Fail-closed: a version skew (or an unreadable `0.0.0` on either
side) pauses polling rather than dispatching a skewed run. Shared across all poll loops.

### Run-time callbacks
See root **Run-time callbacks**: the engine posts `updateRunProgress`, `updateStepProgress`,
`sendFlowResponse`, and `uploadRunLog` to the app **directly over HTTP**; they do not travel back
through the worker. The worker's own terminal-state report (`uploadRunLog` for a crash/OOM the engine
could not report) is the one call it still makes over the socket `apiClient`.
