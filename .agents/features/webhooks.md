# Webhooks Module

## Summary
Ingests inbound HTTP requests from external services and routes them to flows for execution. The module normalizes request payloads (handling multipart, binary, JSON, and text), supports both synchronous (blocking, waits for flow response) and asynchronous (fire-and-forget) execution modes, manages handshake verification for external services that challenge webhook ownership, and enforces payload size limits. It is the primary entry point for event-driven flow execution from outside Activepieces.

## Key Files
- `packages/server/api/src/app/webhooks/webhook.service.ts` — core routing, sync/async execution, flow resolution
- `packages/server/api/src/app/webhooks/webhook-controller.ts` — 5 route registrations (sync, async, draft sync, draft async, test)
- `packages/server/api/src/app/webhooks/webhook-request-converter.ts` — payload normalization and file upload
- `packages/server/api/src/app/webhooks/webhook-handshake.ts` — handshake verification logic
- `packages/server/api/src/app/webhooks/webhook-module.ts` — module registration
- `packages/shared/src/lib/automation/webhook/dto.ts` — WebhookUrlParams schema
- `packages/shared/src/lib/automation/trigger/index.ts` — WebhookHandshakeStrategy enum and WebhookHandshakeConfiguration schema
- `packages/web/src/app/builder/test-step/custom-test-step/test-webhook-dialog.tsx` — dialog for sending a manual test request to the webhook URL
- `packages/web/src/app/builder/test-step/test-trigger-section/manual-webhook-test-button.tsx` — button that opens the test webhook dialog
- `packages/web/src/app/builder/test-step/test-trigger-section/index.tsx` — test trigger panel (includes webhook test entry point)
- `packages/components/icons/webhook.tsx` — webhook icon used across the UI

## Edition Availability
- Community (CE): all webhook functionality
- Enterprise (EE): same as CE
- Cloud: same as CE; payload size and timeout configurable per environment

## Domain Terms
- **Sync webhook** (`/:flowId/sync`) — blocks the HTTP connection until the flow completes and returns the flow's response payload
- **Async webhook** (`/:flowId`) — queues execution and returns 200 immediately with an `x-webhook-id` header
- **Draft webhook** — routes to the latest (draft) flow version instead of the published version; used for testing
- **Test endpoint** (`/:flowId/test`) — captures the request as sample data without executing the flow
- **Handshake** — a one-time ownership challenge sent by external services before activating a webhook subscription
- **HandshakeStrategy** — how ownership is verified: `HEADER_PRESENT`, `QUERY_PRESENT`, `BODY_PARAM_PRESENT`, `NONE`
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
1. Offload payload to S3 if > `AP_WEBHOOK_PAYLOAD_INLINE_THRESHOLD_KB` (default 512KB)
2. Queue BullMQ job (`WorkerJobType.EXECUTE_WEBHOOK`)
3. Return 200 with `x-webhook-id` header immediately

**Sync path**:
1. Create FlowRun with `ProgressUpdateType.WEBHOOK_RESPONSE`
2. Register one-time listener via `engineResponseWatcher`
3. Wait for engine to send response (timeout: `AP_WEBHOOK_TIMEOUT_SECONDS`, default 30)
4. Return flow's response (status, body, headers) or 204 on timeout

## Request Conversion

`webhookRequestConverter.convertRequest()` normalizes incoming data:
- **Multipart form-data**: Uploads files to File service, returns URLs in JSON
- **Binary content** (image/*, video/*, audio/*, pdf, zip, gzip, octet-stream): Uploads to File service
- **JSON/text**: Passes through as-is
- Preserves `rawBody` for signature verification (non-binary only)
- Extracts headers: `x-parent-run-id`, `x-fail-parent-on-failure` (for subflows)

## Handshake Verification

External services verify webhook ownership before sending events:
- **HEADER_PRESENT**: Check for specific header
- **QUERY_PRESENT**: Check for query parameter
- **BODY_PARAM_PRESENT**: Check for body field
- Submits HANDSHAKE hook job to worker → piece validates signature → returns verification response

## Payload Size Limit

`AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` (default 5MB). Returns 413 if exceeded.

## Flow Resolution

- Uses `flowExecutionCache` for fast lookup
- LOCKED_FALL_BACK_TO_LATEST: uses `publishedVersionId` if exists, else latest
- Returns 410 GONE if flow not found, 404 if disabled
