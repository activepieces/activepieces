---
icon: 🪝
---

# Webhooks

Webhooks are the primary entry point for event-driven flow execution from outside Activepieces. The module ingests inbound HTTP requests, normalizes payloads (multipart/binary/JSON/text), routes them to flows, and supports both sync (blocking) and async (fire-and-forget) execution.

### Entities & services
- `webhook.service.ts` — routing, sync/async execution, flow resolution.
- `webhook-request-converter.ts` — payload normalization + file upload.
- `webhook-handshake.ts` — ownership-challenge verification.
- **engineResponseWatcher** — one-time listener bridging the BullMQ engine response back to the waiting HTTP connection for sync mode.
- **flowExecutionCache** — Redis fast path for resolving flow metadata without hitting Postgres per request.

### How it works
- **5 public routes** (all accept GET/POST/PUT/DELETE/PATCH):
  - `/:flowId/sync` — production sync, blocks and returns flow response (LOCKED_FALL_BACK_TO_LATEST).
  - `/:flowId` — production async, queues job, returns 200 + `x-webhook-id`.
  - `/:flowId/draft/sync` and `/:flowId/draft` — testing against the draft version.
  - `/:flowId/test` — captures request as sample data, no execution.
- **Async**: offload payload to S3/DB if over `AP_WEBHOOK_PAYLOAD_INLINE_THRESHOLD_KB` (default 512KB) → queue `EXECUTE_WEBHOOK` → return 200. Job carries a `JobPayload` union (`inline` or `ref`); the **engine** resolves it at execution time (workers no longer fetch payloads).
- **Sync**: create FlowRun with `WEBHOOK_RESPONSE` → register `engineResponseWatcher` → wait (`AP_WEBHOOK_TIMEOUT_SECONDS`, default 30; MCP overrides it with `AP_FLOW_TIMEOUT_SECONDS`) → return the flow response, **500** if the run ended in a failure status, or **408** `REQUEST_TIMEOUT` when nothing answered at all. This route's default was **204** `NO_CONTENT` until 0.86.0 (#13909) changed it to 408; the waitpoint sync resume route still defaults to 204.
- **Version resolution** `LOCKED_FALL_BACK_TO_LATEST`: uses `publishedVersionId` if set, else latest draft.
- **Payload normalization** (`convertRequest`): multipart parts and binary bodies upload to the File service and the payload carries URLs; JSON/text pass through. `BINARY_CONTENT_TYPE_PATTERNS` covers `image/*`, `video/*`, `audio/*`, `application/pdf|zip|gzip|octet-stream` and `text/csv` (each also needs a `addContentTypeParser` entry in `webhook-module.ts` to stream rather than parse). Subflow linkage is read off `x-parent-run-id` / `x-fail-parent-on-failure`.

### Gotchas
- **Streaming ingestion**: webhook files stream straight to S3 (only when `FILE_STORAGE_LOCATION=S3`; DB storage still buffers to bytea). `attachFieldsToBody` is NOT registered globally — each multipart route must opt in (webhook uses `request.parts()`); a route expecting `ApMultipartFile` without the hook fails with `400 body/ Invalid input`.
- **rawBody / signatures**: captured only for small signed types (JSON/XML/text) via a scoped `preParsing` hook. Streamed types (multipart, binary) forgo rawBody — multipart signature verification is a dropped trade-off.
- **Size guard**: `AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` (default 5MB) → 413. Raw-binary bodies pipe through `enforceByteLimit`; oversized multipart parts are failed at end-of-stream (busboy flags `truncated` cleanly rather than erroring).
- **Handshake** runs BEFORE the disabled-flow guard, so ownership pings work both during the publish window and for re-verification on enabled flows. Strategies: `HEADER_PRESENT`, `QUERY_PRESENT`, `BODY_PARAM_PRESENT`, `NONE`, `HEAD_REQUEST` (e.g. Trello).
- Flow resolution returns 410 GONE if not found; 404 if disabled (unless the request matches the flow's handshake config).
- **Two things answer a sync webhook, and they answer for different reasons.** A piece hook answers with the flow's own response: `piece-executor.ts` posts `sendFlowResponse` when a step returns a `respond`/`stopped`/`paused` hook response *and* that step's piece matches `constants.triggerPieceName`. A terminal failure status answers with 500: `engineRunCallbackService.uploadRunLog` publishes to `engine-run:sync:<workerHandlerId>` when the reported status is `FAILED`, `INTERNAL_ERROR`, `TIMEOUT`, `MEMORY_LIMIT_EXCEEDED` or `LOG_SIZE_EXCEEDED` and the request carries both correlation ids. Everything else still falls through to the listener's 408 default, which now means only two things: the run is still going, or it succeeded without reaching a Return Response step.
- **Of the five failure statuses the gate answers, `TIMEOUT` is the one that almost never reaches a caller.** A run only becomes `TIMEOUT` when the worker kills the sandbox at `AP_FLOW_TIMEOUT_SECONDS` (default 600), while the sync listener gives up at `AP_WEBHOOK_TIMEOUT_SECONDS` (default 30), so on a default install the caller has had its 408 twenty times over and the 500 publish lands on a deleted listener as a no-op. It pays off in three configurations only: a webhook timeout raised above the flow timeout (the docs allow up to 15 minutes against a 600s flow default), a flow timeout lowered below the webhook timeout, and the MCP `runFlowAsTool` path, which waits exactly `AP_FLOW_TIMEOUT_SECONDS` and so ties with the run's own timeout. The worker-reported statuses that actually pay off inside a default 30s window are `INTERNAL_ERROR` (the sandbox crash sampled on cloud died in 3.25s) and `MEMORY_LIMIT_EXCEEDED` (reproducibly ~8s with fat piece bundles, see [workers](../execution-runtime/workers.md)).
- **The 500 gate lives in the app, not in the engine or the worker, because neither can cover the other's failures.** The engine's `FlowVerdict` type can only ever be `PAUSED`, `SUCCEEDED`, `FAILED | LOG_SIZE_EXCEEDED` or `RUNNING`, so an engine-side gate physically cannot report `INTERNAL_ERROR`, `TIMEOUT` or `MEMORY_LIMIT_EXCEEDED`; those are detected by the worker from how the sandbox died. A worker-side gate misses the common case, an ordinary step failure, which the engine reports itself while the worker's job still ends `success`. `POST /v1/engine/run-logs` is the one choke point both post through, so the gate sits there and both senders just carry `workerHandlerId` and `httpRequestId` on the request.
- **A sync webhook used to hang the full timeout on a failed run from 0.80.0 until this fix, answering 204 for the first six releases and 408 after that.** Worker v2 (#11608) deleted `sandbox-event-handlers.ts`, which had published a mapped response on every terminal-and-not-`RUNNING`/`SUCCEEDED`/`PAUSED` run-log upload (`FAILED` and `MEMORY_LIMIT_EXCEEDED` gave 500, `INTERNAL_ERROR` 500, `TIMEOUT` 504, `QUOTA_EXCEEDED` 204). `LOG_SIZE_EXCEEDED` and `CANCELED` existed then but had no case in `getFlowResponse`, so they hit its `default: throw`, which fired *before* `runsMetadataQueue.add` and cost both the response and the metadata write; `LOG_SIZE_EXCEEDED` therefore gets a real 500 now for the first time in any release, so the fix is not a pure restoration, and `UploadRunLogsRequest` lost its two correlation ids in the same refactor, which is why nothing on the app side could answer. The listener's own default then decided the reply, and it was `StatusCodes.NO_CONTENT` in `webhook-handler.ts` until #13909 (0.86.0) switched it to `REQUEST_TIMEOUT`, so a failed run answered a **204 that reads as success to most HTTP clients** through 0.80 to 0.85, and 408 from 0.86 on. At its peak on cloud 0.88.3 this was 7,962 of 20,536 sync calls in 24h (38.8%) across 133 platforms, every one sitting at exactly 30.0s while the run had finished ~27s earlier. `SUCCEEDED` with no Return Response step blocked for the full timeout back then too, so that half was never a regression and is still 408 today.
- **`workerHandlerId` and `httpRequestId` are persisted in exactly one place: `waitpoint.workerHandlerId` and `waitpoint.httpRequestId`, and only for paused runs.** `flow_run` has no such column and no migration ever added one, so for a plain sync run the two ids live only in the BullMQ job payload. That is why answering a waiting caller from the app side means carrying them back on the request rather than looking them up. A useful consequence of the waitpoint columns: an async resume inherits them (`resume-service.ts`), so a resumed run that then fails answers the original sync caller too.
- **Splitting a sync timeout into engine-class and worker-class tells you who can still answer.** Joining timed-out sync runs to their worker `job.execute` event over 3h gave 5,685 with outcome `success` (the engine reported the terminal status itself) against 141 `failed` (137 `SANDBOX_INTERNAL_ERROR`, the rest RPC timeout or socket exit). Note no `flowRun.status` attribute is shipped to ClickHouse, so separating a genuinely failed run from a silent success inside that 5,685 needs a Postgres query on `flow_run.status`.
- **The sync response reaches the caller before the run row says it failed.** `uploadRunLog` only *enqueues* the status onto `runsMetadataQueue`; the Postgres write happens later in that queue's worker, behind a distributed lock. The 500 is published in the same call, so a caller that gets its 500 and immediately reads the run over the API can still see `RUNNING`. Do not assert the persisted status straight after a sync response in a test: poll for it. An e2e assertion written that way failed on exactly this while the response itself was already correct.
- **A retry can never answer a sync caller.** Flow jobs run `attempts: 2` with exponential backoff starting at eight minutes (`job-queue.ts`), so the second attempt lands long after any 30s caller is gone. Publishing a 500 the moment a run fails therefore costs nothing, and waiting for a retry to maybe succeed would buy nothing.

### Editions
Full functionality in CE/EE/Cloud; Cloud makes payload size and timeout configurable per environment.

### Key files
Entry point: `webhookService.handleWebhook`, called from the routes in `webhook-controller.ts`, which `webhookModule` registers in `app.ts`.

- `packages/server/api/src/app/webhooks/` — the whole server module: service, controller, request converter, handshake, module registration
- `packages/core/shared/src/lib/automation/webhook/` — `WebhookUrlParams` and the shared webhook DTOs
- `packages/core/shared/src/lib/automation/trigger/` — `WebhookHandshakeStrategy` enum and handshake configuration schema
- `packages/web/src/app/builder/test-step/` — test webhook dialog, the button that opens it, and the test trigger panel
- `packages/web/src/components/icons/webhook.tsx` — webhook icon used across the UI

Paths verified 2026-07-17. An earlier version pointed at `packages/components/icons/webhook.tsx`; it moved to `packages/web/src/components/icons/webhook.tsx`.
