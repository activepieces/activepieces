---
status: accepted
---

# Streaming file writes go through the app via lib-storage, one path

`ctx.files.write()` accepts a `Readable` (not just a `Buffer`). When a piece writes a stream, the engine PUTs it to the app with **no `Content-Length`** (chunked), and the app streams it to storage with `@aws-sdk/lib-storage`'s `Upload` — S3 for S3-backed types, buffered into `bytea` for DB — so no process holds the whole file in RAM. There is **one** streaming path: through the app. The existing presigned single-PUT redirect (`S3_USE_SIGNED_URLS`) is retained unchanged for the known-length `Buffer` path.

The non-obvious "why one path": a single S3 `PutObject` requires `Content-Length` and rejects chunked bodies, so an unknown-length stream can't use a presigned single PUT. The alternative that keeps unknown-length bytes off the app entirely is **presigned multipart** (engine orchestrates `CreateMultipartUpload` → per-part presigned `UploadPart` → `Complete`, buffering one part at a time). We **rejected** that: it is a new protocol — extra RPCs, an engine-side state machine, and orphaned-multipart cleanup — i.e. a second transport path and a new abstraction, for the marginal benefit of keeping bytes off the app on `S3_USE_SIGNED_URLS`-on deployments. `lib-storage` streams unknown-length data with bounded (~5 MB part) memory, aborts its own multipart upload on error, and reuses the S3 client the app already owns. One path, no new protocol.

## Considered options

- **Presigned multipart (bytes never touch the app).** Correct for keeping the scaling-sensitive app tier out of the byte path, but it is a whole new protocol + engine state machine + abort/cleanup surface. Rejected as over-engineering for the value; revisit only if app egress from large streamed writes measurably hurts.
- **Give the sandbox raw S3 credentials.** Rejected: the sandbox runs arbitrary piece code; raw credentials would expose the whole bucket.
- **Single presigned `PutObject` for streams.** Impossible — `PutObject` needs `Content-Length`.

## Consequences

- Streamed writes relay through the app, bounded to ~5 MB (lib-storage part size), not the full file. On `S3_USE_SIGNED_URLS`-on deployments this means streamed writes are *not* offloaded from the app the way known-length redirects are — an accepted trade for one code path.
- Size is enforced app-side while streaming (`enforceByteLimit` transform on the request body → 413 on overflow), since the stream length is unknown upfront and the engine can't pre-check.
- The redirect-vs-stream decision keys off **Content-Length absence** (chunked = stream), not a magic value.
- Known-length `Buffer` writes are byte-for-byte unchanged (same `uploadFile` / presigned-redirect paths).
- Adds `@aws-sdk/lib-storage`.

## Deferred (not built)

- **Property.file streaming (read side)** — a piece that needs a source stream can produce its own `Readable` (e.g. a streaming HTTP client) and pass it to `ctx.files.write`; a dedicated streaming file-input mode was judged YAGNI.
- **Webhook streaming ingestion** — would require replacing the global buffering multipart handler with a streaming parser; deferred as not surgical.
- **Presigned multipart** — see above.
