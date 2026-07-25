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
- **Sync**: create FlowRun with `WEBHOOK_RESPONSE` → register `engineResponseWatcher` → wait (`AP_WEBHOOK_TIMEOUT_SECONDS`, default 30; callers can override, e.g. MCP uses 5 min) → return flow response or 204 on timeout.
- **Version resolution** `LOCKED_FALL_BACK_TO_LATEST`: uses `publishedVersionId` if set, else latest draft.

### Gotchas
- **Streaming ingestion**: webhook files stream straight to S3 (only when `FILE_STORAGE_LOCATION=S3`; DB storage still buffers to bytea). `attachFieldsToBody` is NOT registered globally — each multipart route must opt in (webhook uses `request.parts()`); a route expecting `ApMultipartFile` without the hook fails with `400 body/ Invalid input`.
- **rawBody / signatures**: captured only for small signed types (JSON/XML/text) via a scoped `preParsing` hook. Streamed types (multipart, binary) forgo rawBody — multipart signature verification is a dropped trade-off.
- **Size guard**: `AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` (default 5MB) → 413. Raw-binary bodies pipe through `enforceByteLimit`; oversized multipart parts are failed at end-of-stream (busboy flags `truncated` cleanly rather than erroring).
- **Handshake** runs BEFORE the disabled-flow guard, so ownership pings work both during the publish window and for re-verification on enabled flows. Strategies: `HEADER_PRESENT`, `QUERY_PRESENT`, `BODY_PARAM_PRESENT`, `NONE`, `HEAD_REQUEST` (e.g. Trello).
- Flow resolution returns 410 GONE if not found; 404 if disabled (unless the request matches the flow's handshake config).

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
