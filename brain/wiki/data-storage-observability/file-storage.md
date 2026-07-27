---
icon: 💾
---

# File Storage

The central service for persisting binary files, backing the execution engine and platform assets. Two backends — Postgres `bytea` (DB) or S3-compatible object storage (AWS S3, R2, MinIO, OCI) — chosen per file by its `FileType`. Available in CE, EE, and Cloud (Cloud typically uses S3 for execution files).

### How storage location is chosen
- **Expiring execution files** (`FLOW_RUN_LOG`, `FLOW_STEP_FILE`, `TRIGGER_EVENT_FILE`, `WEBHOOK_PAYLOAD`, deprecated `TRIGGER_PAYLOAD`) → configurable via `FILE_STORAGE_LOCATION`.
- **Non-expiring files** (platform assets, avatars, knowledge base, project releases, sample data) → always DB.
- Exception: `FLOW_BUNDLE` never expires but uses `FILE_STORAGE_LOCATION` so workers can fetch it from S3 via signed URLs.

### Entities & services
- `file.service.ts` — `save`, `getDataOrThrow` (decompresses transparently), `delete`, `deleteStaleBulk`, `uploadPublicAsset`.
- `s3-helper.ts` — upload/download/signed URLs; `file-compressor.ts` — Zstd (`FileCompression` NONE/ZSTD).
- `file` entity columns: `location`, `s3Key`, `type`, `compression`, `data` (bytea), `metadata` (jsonb).
- Files served through `PUT/GET /v1/files/:fileId`; legacy `/v1/step-files/signed` is a thin JWT-validating 302 redirect.

### Streaming — write side (into AP storage)
- `ctx.files.write()` accepts a `Readable` or `Buffer` (pieces-framework ≥ 0.34.0). Streams are detected by **absent `Content-Length`** → `s3Helper.uploadStream` (~5MB parts) for S3, buffered into bytea for DB. See [decision 000008](../../decisions/000008-streaming-file-writes-go-through-the-app-one-path.md).
- Reference consumer: the Amazon S3 **Read File** action streams `getObject().Body` straight into `files.write`, no in-sandbox buffering.
- Inbound webhook files stream to S3 too; `@fastify/multipart` global `attachFieldsToBody` was removed, so each multipart consumer opts in explicitly ([decision 000011](../../decisions/000011-webhook-files-stream-to-s3-by-dropping-global-multipart-buffering.md)).

### Streaming — input side (out to an external service)
- `Property.File({ streaming: true })` resolves to `ApStreamingFile = { filename, extension?, size?, body: Readable }` instead of the buffered `ApFile` (pieces-framework ≥ 0.35.0). Same `PropertyType.FILE` on the wire, so **zero frontend change**. See [decision 000014](../../decisions/000014-streaming-file-inputs-resolve-to-a-lazy-apstreamingfile.md).
- Resolved in the engine's `fileProcessor` (`packages/server/engine/src/lib/variables/processors/file.ts`): a URL exposes the undrained `fetch` body via `Readable.fromWeb` with `size` from `Content-Length`; a base64 data URL decodes to a one-shot `Readable`. Replaces the unbounded `arrayBuffer()` on the URL path; the `catch → null` contract is kept.
- Reference consumer: the Amazon S3 **Upload File** action — `putObject({ Body: file.body, ContentLength: file.size })`, buffering only when `size` is absent.
- The body is **one-shot**: no whole-stream retry, and `size` is best-effort.

### Gotchas
- Cleanup job runs hourly (`30 */1 * * *`), deletes stale execution files past `EXECUTION_DATA_RETENTION_DAYS`; processes ~4000/iteration, deletes S3 keys in batches of 100.
- S3 deletes send CRC32C checksum (OCI rejects the SDK-default CRC32). `S3_ENDPOINT` set → SDK checksum/aws-chunked encoding disabled for S3-compatible providers.
- `S3_USE_SIGNED_URLS=true` redirects downloads to 7-day pre-signed URLs instead of streaming through the app.

### Key files
Entry point: `fileService`, exported from `file.service.ts` and reached through `fileModule`, which `app.ts` registers along with the `/v1/files` and `/v1/step-files` controllers.

- `packages/server/api/src/app/file/` — the whole feature: service, TypeORM entity, module and cleanup job, controllers, `s3-helper`, `file-compressor`, `files-service` (byte-limit guard, engine-writable types), `signed-file-transport`
- `packages/core/shared/src/lib/core/file/` — `File`, `FileType`, `FileCompression`, `FileLocation`, `FileId`
- `packages/server/engine/src/lib/api/engine-file-api.ts` — the engine's upload/download client, the caller behind the streaming write path
- `packages/server/engine/src/lib/piece-context/file-uploader.ts` — backs `ctx.files.write()` for pieces
- `packages/server/api/test/integration/ce/file/` — controller integration tests, including the streaming PUT
- `packages/server/api/test/unit/app/file/` — the S3 checksum unit test

Paths verified 2026-07-17.
