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
- Seven pieces consume it: Amazon S3, Azure Blob Storage, Dropbox, Google Drive, Microsoft OneDrive, Microsoft SharePoint, FTP/SFTP. Reference implementation is the Amazon S3 **Upload File** action — `lib-storage`'s `Upload` (~5MB parts, no content length needed) since [#14347](https://github.com/activepieces/activepieces/pull/14347); it previously used `putObject({ ContentLength: file.size })` and buffered whenever `size` was absent.
- Three transport shapes, in order of preference: **chunking uploader** (S3 `Upload`, Azure `blockBlobClient.uploadStream` — no length needed, parts individually replayable); **SDK stream sink** (Google Drive `media.body`, SFTP `client.put`); **single-request HTTP PUT** (Dropbox, SharePoint, OneDrive via `httpClient` — needs `Content-Length`, so it reads `file.size` and keeps a `readableToBuffer` fallback when absent).
- The body is **one-shot**: `lib-storage` replays individual parts, but the transfer as a whole cannot be retried. `size` is best-effort — also dropped on `Content-Encoding` responses.
- `httpClient` **skips retries entirely for stream bodies** (`isStream ? 0 : retries`) — the retry loop reuses the pre-serialized body, so replaying a drained `Readable`/form-data `PassThrough` would send a truncated body. Applies to every piece sending a stream through `httpClient`, not just file actions.
- User-facing docs: [Large File Streaming](../../../docs/build-pieces/piece-reference/large-file-streaming.mdx).

### Gotchas
- **On cloud the real key prefix is doubled — `<bucket>/<bucket>/…` — so ad-hoc CLI work against the bucket silently finds nothing.** Cloud's `AP_S3_ENDPOINT` embeds the bucket as a *path segment* (`https://<account>.r2.cloudflarestorage.com/ap-files-prod`), and `getS3Client` sets `forcePathStyle: true` whenever an endpoint is present, so the SDK appends the bucket again. An object the app stores as `pieces/x.tgz` actually lands at `ap-files-prod/pieces/x.tgz` inside bucket `ap-files-prod`. Symptom when you get it wrong: `aws s3 ls` returns `NoSuchKey` on a *prefix* listing (Aug 2026 — cost three attempts to spot). Strip the trailing `/<bucket>` from the endpoint for the CLI, then prepend the bucket name to the prefix; or better, do bulk work through `s3Helper` so the same client resolves the same paths. Note cloud's object store is **Cloudflare R2** while the piece CDN is a **DigitalOcean Space** — two different systems, easy to conflate.
- **The live piece-bundle cache sits *inside* the legacy one — `pieces/v2/` is nested under `pieces/`, so a recursive delete of `pieces/` takes the active cache with it.** `S3_PIECES_PREFIX` in `piece-bundle.ts` is `pieces/v2/`; the bare `pieces/` keys beside it are pre-CDN tarballs left by the older writer. Combined with the doubled prefix above, the real keys are `ap-files-prod/pieces/…` (legacy) and `ap-files-prod/pieces/v2/…` (live). Probe both with `wrangler r2 object get` before any prefix-wide operation — wiping v2 used to be survivable because it refilled lazily, at the cost of a burst of cache misses on every piece. **Both prefixes are now dead storage and safe to sweep:** the `BUNDLE_PIECE` job and the S3 mirror were removed, so `resolve()` no longer reads or writes either prefix and registry pieces redirect straight to the CDN (else npm). The mirror was deleted because it was written from whichever source was preferred *at cache time* and then took precedence over the CDN forever — a bucket populated before the CDN became preferred kept serving the unbundled npm build, which is what fans out one `@activepieces/shared` copy per piece in the engine (see the Workers page).
- **`deleteFiles` succeeding does not mean the objects are gone.** `DeleteObjectsCommand` reports per-object failures in `response.Errors` and does **not** throw, and `Quiet: true` only suppresses the success entries — so a request that "worked" can still have left objects behind. `deleteFiles` logs a warn naming the failure codes, which is all its callers (best-effort cleanup) need. Anything whose *correctness* depends on the prefix being empty afterwards would have to surface those keys and retry — but prefer not to need that at all: a reader that must not see the old objects should read from a new key prefix rather than race a delete against writers that may still be running old code.
- Cleanup job runs hourly (`30 */1 * * *`), deletes stale execution files past `EXECUTION_DATA_RETENTION_DAYS`; processes ~4000/iteration, deletes S3 keys in batches of 100.
- **`deleteStaleBulk`'s SELECT needs an explicit `ORDER BY created` — or the planner picks a Seq Scan for high-cardinality types and blows `statement_timeout` every hour.** The composite index `idx_file_type_created_desc` covers `(type, created)`, and equality-per-type was chosen (over `type IN (…)`) specifically to hit it. But without an `ORDER BY`, PG's LIMIT-cost heuristic reasons that if a type is 10%+ of the table, seq-scanning ~10 heap rows should yield one hit, so cost 2032 for `LIMIT 4000` beats the ~3000 index-scan cost — then in reality the scan wades through dead-tuple bloat and never finishes. Seen Aug 2026 on cloud: `file` table 149M rows / 290 GB / 16.5M dead tuples, `WEBHOOK_PAYLOAD` ≈ 15% of it → **every hourly run timed out at 60 s** for a month, only that one type; other types (FLOW_RUN_LOG, FLOW_STEP_FILE, …) sat under 200 ms. Adding `ORDER BY created ASC` pinned the plan to the index and dropped the same query to ~500 ms. Also true for any future retention-style sweep of `file`: never trust the planner to reach for `(type, created)` from the WHERE alone.
- **Retention cleanup is row-driven, so any S3 object written without a `file` row is immortal.** The job walks `file` rows and deletes each one's `s3Key`; it never lists the bucket. The piece-tarball cache was exactly that shape — keyed by `<name>-<version>.tgz` under a bare prefix, with no row anywhere — so nothing has ever swept it and nothing structurally could, whatever the retention setting says. Checked Aug 2026: no migration or job has ever bulk-deleted the `pieces/` prefix, and the only `deleteFiles` callers are the row-driven cleanup and the health probe's own key. If you add a store path that bypasses the `file` table, you own its lifecycle by hand — prefer writing a row, or expect a manual `wrangler`/`aws s3` operation forever.
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
