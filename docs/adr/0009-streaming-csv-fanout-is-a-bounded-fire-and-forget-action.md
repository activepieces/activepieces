---
status: accepted
amended-by: 0010
---

# Streaming CSV fan-out is a bounded, fire-and-forget piece action

> **Amended by [ADR-0010](./0010-subflow-fan-in-resumes-on-a-terminal-run-tally.md):** the action
> is now fire-and-forget *by default* but gains an opt-in `waitForSubflows` (Subflow Fan-in) mode.
> The "wait-for-response fan-in" rejection below applied to waiting *inline*; ADR-0010 does the wait
> via a waitpoint pause instead, so the 600s dispatch ceiling and everything else here still hold.

The `Stream CSV to Subflows` action (`@activepieces/piece-subflows`) streams a CSV **from a URL** — doing its own `responseType: 'stream'` GET into a streaming CSV parser — and dispatches one **fire-and-forget** Subflow call per batch (`data = { batchIndex, headers, rows }`), with bounded in-flight concurrency and stream backpressure. It is a **pure piece with zero engine/framework changes**: reading a source stream inside a piece is the read-side escape hatch [ADR-0007](./0007-streaming-files-use-presigned-multipart-not-app-relay.md) already sanctioned. Streaming bounds **memory, not time**, so the action is capped by `FLOW_TIMEOUT_SECONDS` (default 600s, fixed on Cloud) like any step; a file whose fan-out can't finish inside that window is explicitly out of scope for v1.

## Considered options

- **Resumable checkpointing** (record byte offset in `context.store`, continue past the timeout via HTTP `Range` requests across many pause/resume windows). Handles unbounded files but is a real project — offset bookkeeping, resumption correctness, dedupe/idempotency. Rejected as over-engineering for v1; the `batchIndex` in each payload leaves the door open (a user can re-run from a known offset). Revisit only if the 600s ceiling measurably blocks real files.
- **Backend BullMQ job outside the sandbox** (not bounded by `FLOW_TIMEOUT_SECONDS`). Correct for truly massive files, but it is not a piece — it needs API + queue + entity work and a new operational surface. Wrong shape for the request.
- **`Property.File` input.** Impossible for the stated driver — the engine materializes it into an `ApFile` Buffer before `run()` starts, so the file is fully in memory before any streaming code runs. The reference must be a URL the piece streams itself.
- **Wait-for-response fan-in** (parent waits for every subflow). Incompatible with a many-batch fan-out inside one 600s step; fire-and-forget is the only model that fits.

## Consequences

- **At-least-once, not exactly-once.** A mid-stream dispatch failure retries with backoff then aborts loud with the failed `batchIndex`; batches already dispatched keep running. No automatic rollback or fan-in.
- **Hard size ceiling.** Files that can't stream-and-dispatch within `FLOW_TIMEOUT_SECONDS` are unsupported in v1 — documented, fails loud (never a silent partial fan-out).
- **No infra debt.** No framework read-side streaming API, no new server job, no new entity. Bounded (~5 MB parser + one batch in flight) memory regardless of file size.
