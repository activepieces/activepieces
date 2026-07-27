---
status: accepted
---

# Streaming CSV fan-out is a bounded, fire-and-forget piece action

## Decision
The `Stream CSV to Subflows` action (`@activepieces/piece-subflows`) streams a CSV **from a URL** — its own `responseType: 'stream'` GET piped into a streaming CSV parser — and dispatches one **fire-and-forget** Subflow call per batch (`data = { batchIndex, headers, rows, extraData }`), with bounded in-flight concurrency and stream back-pressure. It is a pure piece with zero engine or framework change. Streaming bounds **memory, not time**, so the step stays capped by `FLOW_TIMEOUT_SECONDS` (default 600s, fixed on Cloud) like any other; a file whose fan-out can't finish inside that window is explicitly out of scope for v1.

## Context
The driver is fanning a large CSV out to one subflow run per batch of rows without the parent step ever holding the file. Framework read-side streaming was deferred as YAGNI when the write side landed (see [000008](./000008-streaming-file-writes-go-through-the-app-one-path.md)), which leaves a piece reading its own source stream as the available path.

## Why
- **Resumable checkpointing** (record the byte offset in `context.store`, continue past the timeout with HTTP `Range` requests across pause/resume windows) handles unbounded files but is a real project — offset bookkeeping, resumption correctness, dedupe/idempotency. Rejected as over-engineering for v1; the `batchIndex` in each payload leaves the door open, and a user can re-run from a known offset. Revisit only if the 600s ceiling measurably blocks real files.
- **A backend BullMQ job outside the sandbox** escapes `FLOW_TIMEOUT_SECONDS` and is correct for truly massive files, but it is not a piece — it needs API, queue and entity work plus a new operational surface. Wrong shape for the request.
- **`Property.File` input** is impossible here: the engine materializes it into an `ApFile` Buffer before `run()` starts, so the whole file is in memory before any streaming code executes. The reference must be a URL the piece streams itself.
- **Wait-for-response fan-in** (parent waits for every subflow) can't fit many batches inside one 600s step; fire-and-forget is the only model that works at fan-out width. `Call Flow` remains the wait-for-response path for single invocations.

## Consequences
At-least-once, not exactly-once: a mid-stream dispatch failure retries with backoff, then aborts loud with the failed `batchIndex`, and batches already dispatched keep running — no automatic rollback and no fan-in. The size ceiling is hard: files that can't stream-and-dispatch within `FLOW_TIMEOUT_SECONDS` are unsupported in v1, documented and failing loud rather than as a silent partial fan-out. No infra debt in exchange — no framework read-side streaming API, no new server job, no new entity — and memory stays bounded (~5 MB parser plus the in-flight batches) regardless of file size.
