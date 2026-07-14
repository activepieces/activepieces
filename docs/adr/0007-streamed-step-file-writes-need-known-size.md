# Streamed step-file writes require a known size and only bypass buffering on the S3 signed-URL transport

`context.files.write` accepts a Node `Readable` in addition to a `Buffer`, but a stream **must** carry its byte `size`: the only zero-buffer path is a single pre-signed S3 PUT, which needs a `Content-Length` (chunked transfer-encoding is rejected by R2/MinIO/OCI, and a single pre-signed URL can't do multipart). Because the engine can't read the storage config from its env and can't replay a single-use stream through the existing PUT→redirect flow, streams do a small preflight roundtrip that returns `{ mode, putUrl?, readUrl }` before the stream is consumed. On any non-S3-signed transport (default self-hosted DB `bytea`, or proxy→S3) it transparently falls back to buffering — always correct, just no memory win there.

## Considered Options

- **Refuse streams when the transport can't stream** — rejected: violates the self-hosting zero-setup rule; a piece written for streaming would be broken on default installs.
- **Stream unbounded data through the app via multipart (`s3Helper.uploadStream`)** — rejected: much larger diff (controller + body-parsing changes) and still bounded by `bodyLimit`; requiring the caller's known size keeps the engine→S3 path direct.
- **Reuse `MAX_FILE_SIZE_MB` as the cap** — rejected in favour of a dedicated `MAX_STREAM_FILE_SIZE_MB` (default 512) so large streamed files don't inflate the global Fastify `bodyLimit` for every other upload.

## Consequences

- The OOM-avoidance goal is only realized on the S3 signed-URL transport (Cloud, or self-hosted with `S3_USE_SIGNED_URLS=true`). This must be documented so users don't expect it on default DB installs.
- `FilesService.write` gains an overload but stays backward compatible; existing `Buffer` callers keep the single-PUT + redirect-replay path with no extra roundtrip.
