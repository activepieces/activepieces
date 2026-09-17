---
status: accepted
---

# Streaming file writes go through the app, one path

## Decision
`ctx.files.write()` accepts a `Readable`. A streamed write PUTs to the app with no `Content-Length` (chunked), and the app streams it to storage with `@aws-sdk/lib-storage` (S3, or buffered to `bytea` for DB), bounded to ~5 MB parts. There is one streaming path — through the app. The known-length `Buffer` path keeps its presigned single-PUT redirect unchanged.

**Amended Aug 2026 — the engine no longer sends that chunked PUT.** It drains a `Readable` to a `Buffer` (capped by `AP_MAX_FILE_SIZE_MB`) and always declares a `Content-Length`, because a buffering proxy adds that header upstream and made the app redirect a body that could not be replayed (see [File Storage](../data-storage-observability/file-storage.md) gotchas). Since a write is capped far below the sandbox's memory budget anyway, streaming it bought nothing and cost whole-transfer retry and the S3→DB fallback. The app-side streaming ingest below stays as-is: it still runs for every deployment without the signed-URL redirect.

## Context
A single S3 `PutObject` requires `Content-Length` and rejects chunked bodies, so an unknown-length stream can't use a presigned single PUT.

## Why
The alternative that keeps bytes off the app — presigned multipart (engine orchestrates Create → UploadPart → Complete) — is a whole new protocol plus an engine-side state machine and orphan-cleanup surface, for the marginal benefit of offloading on `S3_USE_SIGNED_URLS` deployments. `lib-storage` streams unknown-length data with bounded memory, self-aborts on error, and reuses the app's S3 client. Also rejected giving the sandbox raw S3 credentials (it runs arbitrary piece code).

## Consequences
On signed-URL deployments, streamed writes are not offloaded from the app the way known-length redirects are — accepted for one code path. Size is enforced app-side while streaming (413 on overflow) — and, since the amendment, engine-side as a USER `FileSizeError` before any bytes leave the sandbox. Known-length `Buffer` writes are byte-for-byte unchanged. Read-side (Property.file) streaming and presigned multipart are deferred as YAGNI.
