---
status: accepted
---

# Streaming CSV fan-out is a bounded, fire-and-forget piece action

## Decision

The `Stream CSV to Subflows` action (`@activepieces/piece-subflows`) streams a CSV from a **streaming** `Property.File` — `file.body` piped into a streaming CSV parser — and dispatches one **fire-and-forget** Subflow call per batch (`data = { batchIndex, headers, rows, extraData }`), with bounded in-flight concurrency and stream back-pressure. It is a pure piece with zero engine or framework change. Streaming bounds **memory, not time**, so the step stays capped by `FLOW_TIMEOUT_SECONDS` (default 600s, fixed on Cloud) like any other; a file whose fan-out can't finish inside that window is explicitly out of scope for v1.

## Context

The driver is fanning a large CSV out to one subflow run per batch of rows without the parent step ever holding the file. This was designed while framework read-side streaming was still deferred as YAGNI (see [000008](./000008-streaming-file-writes-go-through-the-app-one-path.md)), so a piece reading its own source stream via an `axios` GET on a URL text field was the only available path. Read-side streaming landed before this shipped ([000014](./000014-streaming-file-inputs-resolve-to-a-lazy-apstreamingfile.md)), so the input moved to a streaming `Property.File` and the piece dropped `axios` — the fan-out half is unaffected either way.

## Why

- **Resumable checkpointing** (record the byte offset in `context.store`, continue past the timeout with HTTP `Range` requests across pause/resume windows) handles unbounded files but is a real project — offset bookkeeping, resumption correctness, dedupe/idempotency. Rejected as over-engineering for v1; the `batchIndex` in each payload leaves the door open, and a user can re-run from a known offset. Revisit only if the 600s ceiling measurably blocks real files.
- **A backend BullMQ job outside the sandbox** escapes `FLOW_TIMEOUT_SECONDS` and is correct for truly massive files, but it is not a piece — it needs API, queue and entity work plus a new operational surface. Wrong shape for the request.
- **A plain (non-streaming)** `Property.File` **input** is impossible here: the engine materializes it into an `ApFile` Buffer before `run()` starts, so the whole file is in memory before any streaming code executes. `streaming: true` is what makes the file-picker shape viable — it resolves to an `ApStreamingFile` whose `body` is consumed lazily.
- **Wait-for-response fan-in** (parent waits for every subflow) can't fit many batches inside one 600s step; fire-and-forget is the only model that works at fan-out width. `Call Flow` remains the wait-for-response path for single invocations.

## Consequences

At-least-once, not exactly-once: a mid-stream dispatch failure retries with backoff, then aborts loud with the failed `batchIndex`, and batches already dispatched keep running — no automatic rollback and no fan-in. Handing the retry loop to `httpClient` (`retries: 2`) rather than hand-rolling it also narrowed *what* retries: the hand-rolled loop caught any thrown error, `httpClient` retries only 5xx and network errors, so every 4xx now aborts on the first attempt. Because step-level retry would re-dispatch the whole file, the action hides the `retryOnFailure` toggle. The size ceiling is hard: files that can't stream-and-dispatch within `FLOW_TIMEOUT_SECONDS` are unsupported in v1, documented and failing loud rather than as a silent partial fan-out. No infra debt in exchange — no framework read-side streaming API, no new server job, no new entity — and memory stays bounded (\~5 MB parser plus the in-flight batches) regardless of file size.

Two knock-on effects of taking the input from the engine rather than fetching it in the piece. The piece no longer declares an HTTP client at all, which is why `axios` is absent from its `package.json` (`pieces-common` migrated off axios deliberately; only 3 of \~400 pieces still declare it). And the timeout on the source fetch is no longer the piece's to set: the engine's `fileProcessor` uses a plain `fetch` with no timeout, so a source that connects and then stalls still burns `FLOW_TIMEOUT_SECONDS` — the same exposure every other streaming piece has, rather than one this action can fix locally.
