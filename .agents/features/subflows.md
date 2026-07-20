# Subflows

## Summary
The Subflows piece (`@activepieces/piece-subflows`) lets one flow invoke another flow (a **Subflow**) as if it were a reusable function. A subflow exposes a **Callable Flow** trigger; a parent flow reaches it with a webhook POST to `/v1/webhooks/:flowId`. The parent can call a subflow once (**Call Flow**, optionally waiting for a response via a waitpoint) or fan out many calls from a single streaming step (**Stream CSV to Subflows**). The **Respond** action lets a subflow send data back to a waiting parent.

## Key Files
- `packages/pieces/core/subflows/src/index.ts` — piece definition
- `packages/pieces/core/subflows/src/lib/actions/call-flow.ts` — Call Flow action (one call, optional wait-for-response)
- `packages/pieces/core/subflows/src/lib/actions/stream-csv-to-flow.ts` — Stream CSV to Subflows action (streaming fan-out, one call per batch)
- `packages/pieces/core/subflows/src/lib/actions/respond.ts` — Respond action (subflow → parent)
- `packages/pieces/core/subflows/src/lib/triggers/callable-flow.ts` — Callable Flow trigger
- `packages/pieces/core/subflows/src/lib/common.ts` — flow dropdown, `findFlowByExternalIdOrThrow`, request/response types, callback key

## Edition Availability
Community, Enterprise, Cloud (core piece, no gating).

## Actions

### Call Flow
Invokes one subflow. Optionally creates a waitpoint and waits for the subflow's `Respond` callback; can fail the parent run on subflow error.

### Stream CSV to Subflows
Streams a CSV from a URL (no full-file buffering) and dispatches one subflow call per batch of rows — fire-and-forget by default, or waiting for all children (opt-in).
- **Input**: a CSV **URL** (not `Property.File` — that materializes an `ApFile` Buffer and would OOM before `run()`), a target `subflow` (Callable Flow dropdown), `batchSize` (default 100), delimiter (comma/tab), optional `extraData`, `waitForAllSubflows` (default false), `maxWaitMinutes` (default 60, only used when waiting).
- **Streaming**: the action does its own streaming GET (`responseType: 'stream'`) and pipes into a streaming CSV parser — the read-side escape hatch ADR-0007 describes, so **no engine/framework changes**.
- **Payload per call**: `data = { batchIndex, headers, rows, extraData }`.
- **Dispatch**: fire-and-forget (no `callbackUrl`, `FAIL_PARENT_ON_FAILURE=false`), bounded in-flight concurrency (~5) with stream backpressure (parsing pauses when the window is full).
- **Failure**: a failed batch POST retries with backoff, then aborts the stream and throws with the failed `batchIndex`. At-least-once — already-dispatched subflows keep running.
- **Ceiling**: bounded by `FLOW_TIMEOUT_SECONDS` (default 600s, fixed on Cloud). Streaming bounds *memory*, not *time*; a file whose fan-out can't finish within the flow timeout is out of scope for v1 (documented, not resumable). See ADR-0009.
- **Wait for all subflows (opt-in)**: when `waitForAllSubflows` is set, the action captures a baseline rollup, dispatches as usual, then pauses on a self-resuming 30s `DELAY` waitpoint and polls `GET /v1/engine/flow-runs/count-by-parent` until every dispatched child is terminal. Completion is count-based (`(succeeded + failed) - baseline >= batchesDispatched && nonTerminal === 0`) because child `flow_run` rows are recorded asynchronously. A failed child is **counted, not thrown**. Bounded by `maxWaitMinutes`; on expiry it continues with a `timedOut` summary. Poll/verdict logic is the pure `evaluateFanIn` helper in `fan-in.ts`. **v1 limitation**: don't mix fire-and-forget and wait-for-all subflow steps in one run — child counts conflate; a loud guard rejects starting a wait when the run already has non-terminal children. See ADR-0009 (Fix B).
- **Returns**: fire-and-forget `{ headers, firstRow, rowsProcessed, batchesDispatched }`; wait mode `{ batchesDispatched, succeeded, failed, stillRunning, timedOut, headers, firstRow }`.

### Respond
Sends a `{ status, data }` response from a subflow back to the parent's waitpoint callback URL.

## Domain Terms
See [Automation Core → Subflows](../contexts/automation-core/CONTEXT.md): Subflow, Callable Flow, Call Flow, Subflow Fan-out, Batch.
