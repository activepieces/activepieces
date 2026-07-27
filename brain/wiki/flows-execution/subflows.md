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
- **Stream CSV to Subflows**: input is a CSV **URL** (not `Property.File` — that materializes an `ApFile` Buffer before `run()` starts and would OOM), a Callable Flow dropdown target, `batchSize` (default 100), delimiter (comma/tab) and optional `extraData` merged into every call.
  - The action does its own `responseType: 'stream'` GET and pipes into a streaming `csv-parse` parser. Framework read-side streaming is deferred ([000008](../../decisions/000008-streaming-file-writes-go-through-the-app-one-path.md)), so a piece streaming its own source is the sanctioned path — zero engine or framework change.
  - Payload per call: `data = { batchIndex, headers, rows, extraData }`. Dispatch is fire-and-forget — no `callbackUrl`, `x-fail-parent-on-failure: false`.
  - `fanOutBatches` bounds in-flight dispatches (5) and awaits `Promise.race` when the window is full, so parsing back-pressures instead of buffering the file.
  - Returns `{ headers, firstRow, rowsProcessed, batchesDispatched }`.
- **Failure**: a batch POST retries 3 times with exponential backoff (capped 8s), then the fan-out stops reading the stream and throws with the failed `batchIndex`. Already-dispatched subflows keep running — at-least-once, no fan-in, no rollback.

### Gotchas
- **`text/csv` is a binary content type on the webhook path.** The converter uploads it to the File service rather than parsing it as text, which is what lets a subflow receive a CSV body without buffering.
- **Time, not memory, is the ceiling.** Streaming bounds memory; the step is still capped by `FLOW_TIMEOUT_SECONDS` (default 600s, fixed on Cloud). A file whose fan-out cannot finish inside that window is out of scope for v1 — it fails loud, never a silent partial fan-out. See [000014](../../decisions/000014-streaming-csv-fanout-is-a-bounded-fire-and-forget-action.md).
- **Fan-out is not Call Flow.** Wait-for-response is incompatible with many batches inside one step; only Call Flow can wait.
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
