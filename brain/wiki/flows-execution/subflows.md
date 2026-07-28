---
icon: 🪆
---

# Subflows

A **Subflow** is a flow invoked by another flow instead of by its own external trigger — a reusable function at flow granularity. The `@activepieces/piece-subflows` core piece supplies both halves: the **Callable Flow** trigger that makes a flow callable, and the actions a parent uses to reach it. A parent calls a subflow once (**Call Flow**, optionally waiting for a response through a waitpoint) or fans out many calls from one streaming step (**Stream CSV to Subflows**). The **Respond** action sends data back to a waiting parent. There is no dedicated transport: every call is a webhook `POST` to `/v1/webhooks/:flowId`.

### Entities & services
No server entity of its own — subflows are ordinary flows plus two conventions on the webhook path.
- **Callable Flow** trigger — marks a flow as callable; receives the parent's `data` payload and an optional `callbackUrl`.
- **Call Flow** action — one invocation, optional wait-for-response via a waitpoint, can fail the parent run on subflow error.
- **Stream CSV to Subflows** action — streaming fan-out, one fire-and-forget call per **Batch** of CSV rows.
- **Respond** action — posts `{ status, data }` to the parent's `callbackUrl`.
- `common.ts` — the Callable Flow dropdown (`listFlowsWithSubflowTrigger`), `findFlowByExternalIdOrThrow`, request/response types, callback key.
- Parent linkage rides two headers the webhook request converter reads: `x-parent-run-id` and `x-fail-parent-on-failure`.

### How it works
- **Call Flow**: resolves the target by `externalId` → POSTs `{ data, callbackUrl? }` to the subflow's production webhook. With wait-for-response it creates a `WEBHOOK` waitpoint, passes its resume URL as `callbackUrl`, and pauses until `Respond` calls back; the RESUME branch rethrows when the subflow answered `status: 'error'`. Without it the step returns as soon as the webhook is acknowledged.
- **Stream CSV to Subflows**: input is a streaming `Property.File` (`streaming: true`, so it resolves to an `ApStreamingFile` and accepts a URL, an upload, or a previous step's file — a plain `Property.File` would materialize an `ApFile` Buffer before `run()` starts and OOM), a Callable Flow dropdown target, `batchSize` (default 100, capped at 10,000), delimiter (comma/tab) and optional `extraData` merged into every call.
  - The action pipes `file.body` straight into a streaming `csv-parse` parser — the engine owns the fetch, so the piece carries no HTTP client.
  - Parser construction lives in `subflows/csv.ts` (`createCsvParser`), pinned by `test/csv.test.ts`. Its `bom: true`, `relax_column_count: true` and `group_columns_by_name: true` are all load-bearing, not defensive — see the CSV gotchas in [building-pieces](../pieces-engine/building-pieces.md). Because of `group_columns_by_name`, a row value is `string | string[]`: duplicate header names arrive as an array rather than silently dropping a column.
  - Payload per call: `data = { batchIndex, headers, rows, extraData }`. Dispatch is fire-and-forget — no `callbackUrl`, `x-fail-parent-on-failure: false`. `extraData` is re-serialized into **every** batch, so a large `{{step.output}}` reference counts against the webhook `bodyLimit` independently of `batchSize`.
  - `fanOutBatches` bounds in-flight dispatches (5) and awaits `Promise.race` when the window is full, so parsing back-pressures instead of buffering the file.
  - Returns `{ headers, firstRow, rowsProcessed, batchesDispatched }`.
- **Failure**: a batch POST is retried by `httpClient` (`retries: 2`, so 3 attempts, 1s/2s backoff, **5xx and network errors only** — every 4xx aborts on the first try). That is deliberate for a 413 (an oversized batch will never succeed) and for a 404 from a subflow deleted mid-run; the one it costs you is a 429, unreachable self-hosted (`rate-limit.ts` registers `global: false` and webhook routes never opt in) but reachable behind a Cloud edge WAF at `MAX_IN_FLIGHT=5`. After that the fan-out stops reading the stream and throws with the failed `batchIndex` **and the cause**. Already-dispatched subflows keep running — at-least-once, no fan-in, no rollback. A parse error on the read side takes the same exit: in-flight dispatches are drained before throwing, so `rowsProcessed` / `batchesDispatched` still tell the user how far it got.

### Gotchas
- **`text/csv` is a binary content type on the webhook path, on purpose.** It was a **415** before — webhook routes get Fastify's built-ins (json, text/plain) plus `webhook-module.ts`'s explicit list, and the only catch-all parser is scoped to the `/ingest` PostHog proxy. Adding it was therefore additive, not a behaviour change. It buys **compatibility, not capacity**: `application/octet-stream` and `multipart/form-data` already stream to the File service under the same `AP_MAX_FILE_SIZE_MB` ceiling (the converted `{ fileUrl }` payload is far below `MAX_WEBHOOK_PAYLOAD_SIZE_MB`), so the win is senders whose header you *cannot* change — a partner's nightly export, an S3 event notification, a SaaS "POST my report" hook. Don't send a large CSV as `text/plain`: Fastify's string parser and the `preParsing` rawBody hook each buffer the whole body, and it dies at 25MB. Consequence to keep in mind: `rawBody` is not captured for binary types, so HMAC-over-raw-body sees `undefined` — fine here because the payload is `{ fileUrl }` anyway. `text/tab-separated-values` has the same gap and is **not** yet covered, though the action offers a Tab delimiter.
- **Time, not memory, is the ceiling.** Streaming bounds memory; the step is still capped by `FLOW_TIMEOUT_SECONDS` (default 600s, fixed on Cloud). A file whose fan-out cannot finish inside that window is out of scope for v1 — it fails loud, never a silent partial fan-out. See [000015](../../decisions/000015-streaming-csv-fanout-is-a-bounded-fire-and-forget-action.md).
- **Fan-out is not Call Flow.** Wait-for-response is incompatible with many batches inside one step; only Call Flow can wait.
- **"Retry on failure" is hidden on the fan-out action, on purpose.** The framework default (`action.ts`) is `defaultValue: false` but *visible*, and step retry re-runs `run()` from the top — for a fire-and-forget fan-out that means re-reading the file from row 0 and re-dispatching every batch that already landed. A failure at batch 900 would duplicate 900 batches. So the action declares `retryOnFailure: { defaultValue: false, hide: true }`; `continueOnFailure` stays visible. `Call Flow` leaves both visible because one invocation is safe to retry.
- **`batchSize` is capped at 10,000, because "streaming bounds memory" only holds for sane batch sizes.** Peak memory is roughly `(MAX_IN_FLIGHT + 1) × batchSize × rowSize`, so an unbounded `batchSize` defeats the whole design. The cap that bites first in practice is not memory but the webhook `bodyLimit` (`max(AP_MAX_FILE_SIZE_MB + 4, AP_MAX_FLOW_RUN_LOG_SIZE_MB + 4, 25)` MB, 54MB by default) — a wide-row file will 413 well before 10,000 rows.
- The dropdown lists published flows carrying a Callable Flow trigger and labels disabled ones `(inactive)`; streaming to a disabled flow throws before the first request.

### Editions
Community, Enterprise, Cloud — core piece, no plan flag.

### Key files
Entry point: `streamCsvToSubflows.run`, which drives `fanOutBatches` over a streaming CSV parser.

- `packages/pieces/core/subflows/src/index.ts` — piece definition
- `packages/pieces/core/subflows/src/lib/actions/call-flow.ts` — Call Flow (one call, optional wait-for-response)
- `packages/pieces/core/subflows/src/lib/actions/stream-csv-to-flow.ts` — Stream CSV to Subflows (streaming fan-out)
- `packages/pieces/core/subflows/src/lib/actions/respond.ts` — Respond (subflow → parent)
- `packages/pieces/core/subflows/src/lib/triggers/callable-flow.ts` — Callable Flow trigger
- `packages/pieces/core/subflows/src/lib/fan-out.ts` — batching + bounded-concurrency dispatch loop, transport-agnostic
- `packages/pieces/core/subflows/src/lib/common.ts` — flow dropdown, lookup helpers, request/response types
- `packages/server/api/src/app/webhooks/webhook-request-converter.ts` — `text/csv` in `BINARY_CONTENT_TYPE_PATTERNS`, parent-run headers
