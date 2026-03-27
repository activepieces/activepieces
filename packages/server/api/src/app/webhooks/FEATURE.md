# Webhooks Module

Ingests HTTP webhooks, routes them to flows, and handles sync/async execution.

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
