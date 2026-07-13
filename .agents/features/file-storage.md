# File Storage Service

## Summary
The File Storage Service is the central infrastructure for persisting binary files in Activepieces. It supports two storage backends: database (PostgreSQL `bytea`) and S3-compatible object storage (AWS S3, Cloudflare R2, or any S3-compatible endpoint). The backend used for a given file depends on its `FileType` — execution-related files that expire (run logs, step files, trigger payloads, webhook payloads) use the configured `FILE_STORAGE_LOCATION` system property; non-expiring files (platform assets, user profile pictures, knowledge base files, project releases, etc.) always use the database. The one non-expiring exception is `FLOW_BUNDLE` (the prebuilt per-locked-flow-version artifact), which uses the configurable `FILE_STORAGE_LOCATION` so it can be served from S3 even though it never expires. Files are optionally compressed with Zstd. A scheduled system job runs every hour to delete stale execution files beyond the configurable retention window. The `step-file` sub-feature exposes engine-accessible endpoints for pieces to upload and download files produced during a flow run, using short-lived JWT tokens for download authorization.

Large `FLOW_STEP_FILE` outputs are handled pass-by-reference rather than being buffered whole: `saveStream` streams the piece's file into S3 via a multipart upload (falling back to buffering into the DB when the file is DB-backed or S3 is unavailable), so the file never has to fit in memory. Streamed files are capped by `MAX_STREAM_FILE_SIZE_MB` (default 1 GB), separate from the smaller `MAX_FILE_SIZE_MB` limit that applies to fully-buffered uploads.

## Key Files
- `packages/server/api/src/app/file/file.service.ts` — core service: save, getFile, getDataOrThrow, delete, deleteStaleBulk, uploadPublicAsset
- `packages/server/api/src/app/file/file.entity.ts` — TypeORM entity
- `packages/server/api/src/app/file/file.module.ts` — module registration, cleanup job scheduling
- `packages/server/api/src/app/file/s3-helper.ts` — S3 client wrapper (upload, download, delete, signed URLs)
- `packages/server/api/src/app/file/file-compressor.ts` — Zstd compress/decompress utilities
- `packages/server/api/src/app/file/files-controller.ts` — primary file upload/download (`/v1/files`) and legacy `signedStepFileController` redirect for `/v1/step-files/signed`
- `packages/core/shared/src/lib/core/file/index.ts` — `File`, `FileType`, `FileCompression`, `FileLocation`, `FileId`

## Edition Availability
- **Community (CE)**: Fully available — used internally by the execution engine.
- **Enterprise (EE)**: Fully available.
- **Cloud**: Fully available. Cloud typically configures S3 as the storage location for execution files.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **FileType**: Categorizes the purpose of a file. Controls storage location (DB vs S3) and retention policy.
- **FileLocation**: `DB` (stored as `bytea` in Postgres) or `S3` (stored in an S3-compatible bucket with the S3 key recorded in the `s3Key` column).
- **FileCompression**: `NONE` or `ZSTD`. Applied to execution data files to reduce storage size. Decompression is transparent on read, including legacy auto-detection via magic bytes.
- **s3Key**: The object key in the S3 bucket. Format: `platform/<platformId>/<type>/<fileId>` for platform-scoped files, or `project/<projectId>/<type>/<fileId>` for project-scoped files.
- **Retention**: Execution data files are deleted after `EXECUTION_DATA_RETENTION_DAYS` days by a periodic cleanup job.
- **Step file**: A file produced by a piece action during execution (e.g., a generated PDF). Uploaded by the engine, downloaded by end users via a signed JWT token.
- **Platform asset**: Public binary (e.g., a platform logo). Always stored in DB; accessed via `/v1/platforms/assets/<fileId>`.
- **Signed URL**: For S3-backed step files when `S3_USE_SIGNED_URLS=true`, the download endpoint redirects to a time-limited pre-signed S3 URL instead of streaming the data through the API server.

## Entity

**file**
| Column | Type | Notes |
|---|---|---|
| id | string | BaseColumnSchemaPart |
| created | timestamp | BaseColumnSchemaPart |
| updated | timestamp | BaseColumnSchemaPart |
| projectId | string (nullable) | ApIdSchema; null for platform-level files |
| platformId | string (nullable) | ApIdSchema |
| data | bytea (nullable) | Binary content for DB-stored files |
| location | string | FileLocation enum (DB or S3) |
| fileName | string (nullable) | Original filename |
| size | number (nullable) | Size in bytes |
| metadata | jsonb (nullable) | Arbitrary key-value string map (e.g., mimetype) |
| s3Key | string (nullable) | S3 object key for S3-stored files |
| type | string | FileType enum (default UNKNOWN) |
| compression | string | FileCompression enum (default NONE) |

Indices: `idx_file_project_id` on `projectId`; `idx_file_type_created_desc` on `(type, created)` for cleanup queries.
Relation: many-to-one with `project` (CASCADE on delete, FK `fk_file_project_id`).

## FileType Enum

| Value | Storage | Expires | Description |
|---|---|---|---|
| `FLOW_RUN_LOG` | Configurable | Yes | Execution log for a flow run |
| `FLOW_STEP_FILE` | Configurable | Yes | File output from a piece action step |
| `TRIGGER_PAYLOAD` | Configurable | Yes | (Deprecated) Stored trigger payload |
| `TRIGGER_EVENT_FILE` | Configurable | Yes | File output from a trigger event |
| `WEBHOOK_PAYLOAD` | Configurable | Yes | Large webhook payload offloaded from Redis |
| `SAMPLE_DATA` | Always DB | No | Sample trigger data for builder |
| `SAMPLE_DATA_INPUT` | Always DB | No | Sample input data for builder |
| `PLATFORM_ASSET` | Always DB | No | Platform logo/branding images |
| `USER_PROFILE_PICTURE` | Always DB | No | User avatar |
| `PACKAGE_ARCHIVE` | Always DB | No | Piece package archive |
| `PROJECT_RELEASE` | Always DB | No | Project release snapshot |
| `FLOW_VERSION_BACKUP` | Always DB | No | Flow version backup |
| `KNOWLEDGE_BASE` | Always DB | No | File uploaded for AI knowledge base |
| `FLOW_BUNDLE` | Configurable | No | Prebuilt per-locked-flow-version artifact (flow definition + piece manifest + compiled code steps), addressed by flowVersionId. When S3-backed with `S3_USE_SIGNED_URLS`, workers fetch/upload it directly via signed URLs (see Workers feature) rather than streaming through the app over the socket RPC |

## Endpoints

### Step File Controller (`/v1/step-files`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/signed` | public | Legacy signed download — validates the JWT token, then 302 redirects to `/v1/files/{fileId}?token=...` |

Step file uploads are handled by the engine via the unified `PUT /v1/files/:fileId` endpoint. The legacy `/signed` route remains as a thin redirect so older execution outputs continue to resolve through the canonical `/v1/files/:fileId` path (which handles DB streaming or S3 pre-signed redirect).

## Service Methods

**fileService**
- `save({ fileId?, projectId, platformId?, data, size, type, fileName?, compression, metadata? })` — determines location based on type, saves to DB or S3 (with DB fallback on S3 error). Returns the persisted `File` entity.
- `saveStream({ stream, fileName?, type, projectId?, platformId?, metadata?, contentType? })` — streams a `Readable` to storage without buffering the whole file. Chunks the stream into parts (`multipartStream`); DB-backed types (or a single-part S3 stream) buffer and delegate to `save`, otherwise it runs an S3 multipart upload via `s3Helper`, backfilling the row's `size` on completion and aborting the upload + deleting the row on failure. Enforces `MAX_STREAM_FILE_SIZE_MB` for S3 streams and `MAX_FILE_SIZE_MB` for the DB buffering path. Returns the persisted `File` entity.
- `getFile({ projectId, fileId, type? })` — returns `File | null` (metadata only, no data).
- `getFileOrThrow(params)` — throws ENTITY_NOT_FOUND if not found.
- `getDataOrThrow({ projectId, fileId, type? })` — fetches metadata + binary data. Decompresses transparently. Returns `{ data: Buffer, fileName?, metadata? }`.
- `getDataOrUndefined(params)` — same as `getDataOrThrow` but swallows errors and returns undefined.
- `delete({ projectId, fileId })` — deletes from S3 (if applicable) and DB.
- `deleteStaleBulk(types)` — paginated deletion of expired execution files. Processes up to 4000 files per iteration, deletes S3 keys in batches of 100.
- `uploadPublicAsset({ file, type, platformId, allowedMimeTypes?, maxFileSizeInBytes?, metadata? })` — validates MIME type and file size, saves, returns the public URL (`<FRONTEND_URL>/api/v1/platforms/assets/<fileId>`).

**s3Helper**
- `constructS3Key(platformId, projectId, type, fileId)` — builds deterministic S3 key.
- `uploadFile(s3Key, data)` — PutObject to S3.
- `getFile(s3Key)` — GetObject from S3, returns Buffer.
- `getS3SignedUrl(s3Key, fileName)` — generates a 7-day pre-signed GET URL.
- `putS3SignedUrl({ s3Key, contentLength, contentEncoding })` — generates a 7-day pre-signed PUT URL.
- `createMultipartUpload({ s3Key, contentType? })` — starts an S3 multipart upload, returns the `UploadId`.
- `uploadPart({ s3Key, uploadId, partNumber, body })` — uploads one part, returns its `ETag`.
- `signPartUrl({ s3Key, uploadId, partNumber })` — pre-signed PUT URL for one part, short-lived (`STREAMING_URL_EXPIRY_SECONDS`, 1 hour) since a fresh URL is minted per part.
- `completeMultipartUpload({ s3Key, uploadId, parts })` — finalizes the upload from the collected `{ partNumber, etag }` list.
- `abortMultipartUpload({ s3Key, uploadId })` — cancels an in-progress multipart upload.
- `getObjectSize({ s3Key })` — HeadObject, returns `ContentLength` (0 if absent).
- `deleteFiles(s3Keys)` — DeleteObjects in batches of 100 (Cloudflare R2 limit); sends the CRC32C checksum algorithm (OCI Object Storage rejects the SDK-default CRC32).
- `validateS3Configuration()` — smoke test: puts, heads, and deletes a test object.

## Cleanup Job

Scheduled every hour (`30 */1 * * *`) via `SystemJobName.FILE_CLEANUP_TRIGGER`. Calls `fileService.deleteStaleBulk` for types: `FLOW_RUN_LOG`, `FLOW_STEP_FILE`, `TRIGGER_EVENT_FILE`, `TRIGGER_PAYLOAD`, `WEBHOOK_PAYLOAD`. Retention period controlled by `EXECUTION_DATA_RETENTION_DAYS` system property.

## System Properties

| Property | Purpose |
|---|---|
| `FILE_STORAGE_LOCATION` | `DB` or `S3` — controls where expiring execution files are stored |
| `EXECUTION_DATA_RETENTION_DAYS` | Number of days to keep execution files before cleanup |
| `MAX_FILE_SIZE_MB` | Max size for fully-buffered file uploads and the `saveStream` DB fallback path (default 25) |
| `MAX_STREAM_FILE_SIZE_MB` | Max size for S3 multipart-streamed files via `saveStream` (default 1024) |
| `S3_ACCESS_KEY_ID` | S3 credentials (not needed if `S3_USE_IRSA=true`) |
| `S3_SECRET_ACCESS_KEY` | S3 credentials (not needed if `S3_USE_IRSA=true`) |
| `S3_BUCKET` | S3 bucket name |
| `S3_REGION` | S3 region |
| `S3_ENDPOINT` | Custom S3 endpoint URL (for Cloudflare R2, MinIO, OCI Object Storage, etc.). When set, the SDK checksum defaults and aws-chunked upload encoding are disabled (`WHEN_REQUIRED`) for S3-compatible providers; plain AWS keeps SDK defaults |
| `S3_USE_IRSA` | Use IAM Roles for Service Accounts instead of static credentials |
| `S3_USE_SIGNED_URLS` | When true, redirect step file downloads to pre-signed S3 URLs |
