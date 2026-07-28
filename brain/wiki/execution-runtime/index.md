---
icon: ⚙️
---

# Execution Runtime

Where and how a flow job runs. The **Worker is the Sandbox**: it polls a job, resolves it, and forks the engine in-process. Destination model is **concurrency 1 + horizontal replicas**; a transitional mode still honors `AP_WORKER_CONCURRENCY=N`. Glossary below; the *why* lives in the Decision records nested under this page.

### 🏗️ Worker
The deployment unit and the execution unit, now one. Polls jobs, acts as **Resolver**, runs each job in an in-process **Sandbox**, reports the result. Sole holder of the `apiClient`. Destination: **concurrency 1** (one job per container), scaled **horizontally** (N replicas, each capped 0.5 CPU / 1 GB, so an OOM kills one worker → blast radius one job).
- **Transitional mode:** honors `AP_WORKER_CONCURRENCY=N` by running N poll loops over N in-process boxes in one container. Default **5** (main's historical value), so the default deployment *is* this mode. See the decision *Transitional multi-box concurrency*.

### 📦 Sandbox
The single execution box the worker runs in-process. Given fully-resolved inputs it materializes them to disk, runs **one** engine operation in a child process, returns the result. Holds **no app connection** — its only outbound traffic is pulling the blobs named in its params (S3 signed URLs, npm/file-store for pieces).
- *Avoid:* "pool" — the N-box mode is a transitional bridge, not the deleted pool-server architecture. Parallelism at the destination is replicas.

### 🧭 Resolver
Turns a job into materialized box inputs: resolves `flowVersion` + piece metadata, produces a ready (compiled) **Flow Bundle** — cache hit = existing S3 ref; miss = compile, build, publish to S3, then hand back the ref. Disables the flow on a missing piece. **Always the worker** (owns the only `apiClient`). Runs *before* `execute`, so the box only sees healthy, complete, compiled inputs.

### ▶️ execute
The Sandbox's single entry point: `{ operationType, operation, timeoutInSeconds, settings, provision } → { engineResponse, logs }`. `provision` groups resolved deps `{ flowBundle?, pieces?, archiveRefs? }`. Run/dispose are internal (acquire box → run → release, or invalidate on throw).

### 🌡️ Warm / Cold
Whether a run reuses an already-booted engine process (**warm** — steady state with `AP_REUSE_SANDBOX`) or forks a fresh one (**cold** — the edge: first run after deploy/restart/scale-up, or reuse off). A property of dedicated execution, identical on self-host and Cloud — not a Cloud-vs-self-host thing.

### 📡 Run-time callbacks
The four calls a run emits to the app during execution: `updateRunProgress`, `updateStepProgress`, `sendFlowResponse`, `uploadRunLog`. The **engine** posts all four directly over HTTP (`internalApiUrl` + `engineToken`), not back through the worker. `uploadRunLog` is dual-sourced: the worker also calls it to record a terminal status the engine couldn't (crash, OOM). See the decision *Engine posts run-time callbacks directly to the app*.

### 🎚️ Slot / Reservation / Priority Class / Worker Group
- **Slot** — one unit of concurrency (capacity for one in-flight job). Throughput is counted in slots, not workers.
- **Reservation** (Capacity Envelope) — a guaranteed *floor* of slots a tenant always has, strictly partitioned (not lent out). Distinct from a *limit* (a ceiling).
- **Priority Class** — a named tier within a project owning its own sub-Reservation of slots. Not ordering, not preemption.
- **Worker Group** — the deployment pool (`AP_WORKER_GROUP_ID`) that realizes a Reservation by polling its own dedicated queue. The physical partition; the Reservation is the guarantee.

### 🧊 Flow Bundle vs Piece Bundle
- **Flow Bundle** — per-locked-flow-version artifact (frozen piece manifest + compiled code) in S3/DB. The Sandbox only ever consumes a ready one. See the decision *Freeze piece versions in the Flow Bundle manifest*.
- **Piece Bundle** — the installable `.tgz` for one `name@version`, addressed as a **link** (S3, npm, or file-store), resolved lazily. See the decision *Pieces are distributed as links, resolved lazily*.

### 🗃️ Queued Job vs In-flight Run
- **Queued Job** — accepted onto Redis, not yet started; exists only in Redis (an async-webhook Queued Job has no FlowRun row) → as durable as the Redis dataset. See the decision *Async webhook ACK is Redis-durable, not Postgres-durable*.
- **In-flight Run** — a worker is actively executing it; has a FlowRun row + checkpointed log in Postgres/S3, survives worker or Redis loss.

### ⚠️ Gotchas
- **An agent tool's piece can go un-provisioned → `PieceNotFoundError` at runtime.** `extractAgentToolPieceRefs` (`flow-provisioning.ts`) strict-`safeParse`s each `agentTools` entry against `AgentPieceTool` and silently `return []`s on failure. `PredefinedInputsStructure` *requires* `fields`, but flow versions still carry the legacy flat `predefinedInput` (`{ auth, model, … }`) — those all fail to parse, so their pieces never get installed. The engine's `agentTools.tools()` does **no** validation and tolerates the legacy shape, so it happily tries to load the missing piece and the run dies `INTERNAL_ERROR` with an empty `failedStep`. Provisioning must not be stricter than the engine.
- **A wrong Flow Bundle is sticky forever.** `parseManifest` only invalidates on `schemaVersion !== LATEST_FLOW_SCHEMA_VERSION`. A bundle published by buggy/older worker code stays "valid", keeps being served for that locked flow version, and short-circuits `resolvePieces` — so fixing the resolver code does **not** heal affected flows. Recovery is deleting the `FLOW_BUNDLE` file row (its id **is** the `flowVersionId`) + S3 object, or republishing the flow. Worth a bundle-format/generation field in the manifest.
- **`extractConnectionIds` misses agent-tool connections.** It only reads step/trigger `settings.input.auth`, never `agentTools[].pieceMetadata.predefinedInput.auth`, so `flowVersion.connectionIds` under-reports and "which flows use this connection" lies.

---

📁 **Decisions nested under this page:** *Worker is the Sandbox* · *Transitional multi-box concurrency* · *Engine posts run-time callbacks directly* · *Sandbox pool is a pure execute() (superseded)* · *Freeze piece versions in the Flow Bundle manifest*.

## Pages

- **Workers** — the poll loop, worker groups, slots and reservations, and its gotchas: the version gate, system-job edition skew, `kamal app exec` leaking a permanent worker, serial per-queue dispatch as the real throughput cap, the silent mid-poll-loop wedge, and why polling starves first
- **Benchmark CLI** — measuring throughput; queue-wait vs service-time
