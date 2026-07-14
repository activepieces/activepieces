# Webhooks Module

## Summary
Ingests inbound HTTP requests from external services and routes them to flows for execution. The module normalizes request payloads (handling multipart, binary, JSON, and text), supports both synchronous (blocking, waits for flow response) and asynchronous (fire-and-forget) execution modes, manages handshake verification for external services that challenge webhook ownership, and enforces payload size limits. It is the primary entry point for event-driven flow execution from outside Activepieces.

## Key Files
- `packages/server/api/src/app/webhooks/webhook.service.ts` — core routing, sync/async execution, flow resolution
- `packages/server/api/src/app/webhooks/webhook-controller.ts` — 5 route registrations (sync, async, draft sync, draft async, test)
- `packages/server/api/src/app/webhooks/webhook-request-converter.ts` — payload normalization and file upload
- `packages/server/api/src/app/webhooks/webhook-handshake.ts` — handshake verification logic
- `packages/server/api/src/app/webhooks/webhook-module.ts` — module registration
- `packages/core/shared/src/lib/automation/webhook/dto.ts` — WebhookUrlParams schema
- `packages/core/shared/src/lib/automation/trigger/index.ts` — WebhookHandshakeStrategy enum and WebhookHandshakeConfiguration schema
- `packages/web/src/app/builder/test-step/custom-test-step/test-webhook-dialog.tsx` — dialog for sending a manual test request to the webhook URL
- `packages/web/src/app/builder/test-step/test-trigger-section/manual-webhook-test-button.tsx` — button that opens the test webhook dialog
- `packages/web/src/app/builder/test-step/test-trigger-section/index.tsx` — test trigger panel (includes webhook test entry point)
- `packages/components/icons/webhook.tsx` — webhook icon used across the UI

## Edition Availability
- Community (CE): all webhook functionality
- Enterprise (EE): same as CE
- Cloud: same as CE; payload size and timeout configurable per environment

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **Sync webhook** (`/:flowId/sync`) — blocks the HTTP connection until the flow completes and returns the flow's response payload
- **Async webhook** (`/:flowId`) — queues execution and returns 200 immediately with an `x-webhook-id` header
- **Draft webhook** — routes to the latest (draft) flow version instead of the published version; used for testing
- **Test endpoint** (`/:flowId/test`) — captures the request as sample data without executing the flow
- **Handshake** — a one-time ownership challenge sent by external services before activating a webhook subscription
- **HandshakeStrategy** — how ownership is verified: `HEADER_PRESENT`, `QUERY_PRESENT`, `BODY_PARAM_PRESENT`, `NONE`, `HEAD_REQUEST` (for services like Trello that validate by sending a HEAD request)
- **engineResponseWatcher** — a one-time listener that bridges the BullMQ engine response back to the waiting HTTP connection for sync mode
- **LOCKED_FALL_BACK_TO_LATEST** — version resolution: uses `publishedVersionId` if set, falls back to latest draft
- **flowExecutionCache** — Redis-backed fast path for resolving flow metadata without hitting PostgreSQL on every webhook

## Routes (5 endpoints, all public)

| Route | Mode | Version | Purpose |
|-------|------|---------|---------|
| `/:flowId/sync` | SYNC | LOCKED_FALL_BACK_TO_LATEST | Production sync — blocks HTTP, returns flow response |
| `/:flowId` | ASYNC | LOCKED_FALL_BACK_TO_LATEST | Production async — queues job, returns 200 immediately |
| `/:flowId/draft/sync` | SYNC | LATEST | Testing sync — always uses draft version |
| `/:flowId/draft` | ASYNC | LATEST | Testing async — draft version |
| `/:flowId/test` | ASYNC | LATEST | Sample data only — no execution |

All routes accept GET, POST, PUT, DELETE, PATCH methods.

## Sync vs Async Execution

**Async path**:
1. Offload payload to S3/DB if > `AP_WEBHOOK_PAYLOAD_INLINE_THRESHOLD_KB` (default 512KB). The job carries a `JobPayload` discriminated union — `inline` (value embedded) or `ref` (`fileId` of a `WEBHOOK_PAYLOAD` file).
2. Queue BullMQ job (`WorkerJobType.EXECUTE_WEBHOOK`)
3. Return 200 with `x-webhook-id` header immediately

The worker forwards the `JobPayload` straight into the `EXECUTE_TRIGGER_HOOK` engine operation; the **engine** resolves it at execution time (inline value, or a `ref` downloaded via the file-download path — direct bytes or an S3 signed-link redirect). Workers no longer fetch payloads themselves.

**Sync path**:
1. Create FlowRun with `ProgressUpdateType.WEBHOOK_RESPONSE`
2. Register one-time listener via `engineResponseWatcher`
3. Wait for engine to send response (default timeout: `AP_WEBHOOK_TIMEOUT_SECONDS`, default 30; callers may pass `timeoutMs` to override per-invocation, e.g. MCP uses 5 minutes)
4. Return flow's response (status, body, headers) or 204 on timeout

## Request Conversion

Binary and multipart file bodies are **streamed to storage while the request body is still being parsed** (in `webhook-module.ts`), not buffered and converted later:
- **Multipart form-data**: each file part is streamed to the File service via the global `onFile` hook (`streamWebhookMultipartFile`); the field value becomes the file-reference read URL.
- **Binary content** (image/*, video/*, audio/*, pdf, zip, gzip, octet-stream): streamed straight to storage by a content-type parser (`streamWebhookBinaryBody`), body becomes `{ fileUrl }`.
- **JSON/text/XML**: parsed in memory and passed through as-is, keeping `rawBody` for HMAC signature verification (streamed binary/multipart bodies have no `rawBody`).

Because streaming happens during parsing, `webhookRequestConverter.convertRequest()` only ever passes the **already-converted** `request.body` through — it no longer uploads anything. It also carries `rawBody` and extracts subflow headers `x-parent-run-id` / `x-fail-parent-on-failure`.

Streaming requires a resolved `request.webhookContext` (projectId/platformId/flowId), set in the `onRequest` hook before parsing. That hook rejects streamed uploads early (404) for unknown or disabled flows that would never execute, so no orphaned file is persisted.

## Handshake Verification

External services verify webhook ownership before sending events:
- **HEADER_PRESENT**: Check for specific header
- **QUERY_PRESENT**: Check for query parameter
- **BODY_PARAM_PRESENT**: Check for body field
- Submits HANDSHAKE hook job to worker → piece validates signature → returns verification response. The check runs **before** the disabled-flow guard so that handshake pings are processed both during the publish window (flow still DISABLED) and for third-party re-verification pings on ENABLED flows.

## Payload Size Limit

`AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` (default 5MB) bounds in-memory (JSON/text/XML) bodies — returns 413 if exceeded.

Streamed binary/multipart file bodies bypass that limit: they go to storage as they arrive and are bounded instead by `AP_MAX_STREAM_FILE_SIZE_MB` (default 1024MB). On S3 storage a raw binary body (which carries a `Content-Length`) streams straight to S3 in a single `PutObject` (`s3Helper.uploadStream`), capped by that limit. A body of unknown length — multipart form-data file parts, or any DB-storage install — is buffered whole and capped by the smaller `AP_MAX_FILE_SIZE_MB` instead.

## Flow Resolution

- Uses `flowExecutionCache` for fast lookup
- LOCKED_FALL_BACK_TO_LATEST: uses `publishedVersionId` if exists, else latest
- Returns 410 GONE if flow not found; 404 if disabled (unless the request matches the flow's `handshakeConfiguration`, in which case the handshake is processed and the disabled check is skipped)
