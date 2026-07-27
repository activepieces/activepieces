---
status: accepted
---

# Streaming file writes go through the app, one path

## Decision
`ctx.files.write()` accepts a `Readable`. A streamed write PUTs to the app with no `Content-Length` (chunked), and the app streams it to storage with `@aws-sdk/lib-storage` (S3, or buffered to `bytea` for DB), bounded to ~5 MB parts. There is one streaming path — through the app. The known-length `Buffer` path keeps its presigned single-PUT redirect unchanged.

## Context
A single S3 `PutObject` requires `Content-Length` and rejects chunked bodies, so an unknown-length stream can't use a presigned single PUT.

## Why
The alternative that keeps bytes off the app — presigned multipart (engine orchestrates Create → UploadPart → Complete) — is a whole new protocol plus an engine-side state machine and orphan-cleanup surface, for the marginal benefit of offloading on `S3_USE_SIGNED_URLS` deployments. `lib-storage` streams unknown-length data with bounded memory, self-aborts on error, and reuses the app's S3 client. Also rejected giving the sandbox raw S3 credentials (it runs arbitrary piece code).

## Consequences
On signed-URL deployments, streamed writes are not offloaded from the app the way known-length redirects are — accepted for one code path. Size is enforced app-side while streaming (413 on overflow). Known-length `Buffer` writes are byte-for-byte unchanged. Read-side (Property.file) streaming and presigned multipart are deferred as YAGNI.
