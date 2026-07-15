---
status: accepted
---

# Webhook files stream to S3 by dropping the global multipart buffering

Inbound webhook files (multipart parts and raw-binary bodies) stream straight to S3 instead of being buffered whole in the app. Because an inbound third-party POST cannot be redirected, its bytes must transit the app — so the only lever is to stop *accumulating* them. This reuses the write-path primitives (`fileService.save({ data: Readable })`, `s3Helper.uploadStream`, `enforceByteLimit`; see [ADR-0007](0007-streaming-files-use-presigned-multipart-not-app-relay.md)).

Two pieces of shared infrastructure buffered every webhook body and had to change:

1. **`@fastify/multipart`'s `attachFieldsToBody`** is plugin-global with no per-route opt-out — its `preValidation` hook buffers every part of every multipart request into `request.body`. A webhook-only streaming parser would mean reimplementing multipart parsing (a new abstraction). Instead we **drop `attachFieldsToBody` entirely** and migrate all three multipart consumers to explicit `request.parts()`/`request.file()`: webhook streams file parts to S3, `users` (profile picture) and `knowledge-base` buffer via `request.file()`. This *removes* the global `onFile` magic rather than adding anything.

2. **`fastify-raw-body`** (`config.rawBody: true`, `runFirst: true`) buffered the entire raw payload before parsing, so streaming was impossible while it ran. We drop it from webhook routes and instead capture `rawBody` inside the `parseAs: 'string'` content-type parsers (JSON/XML/form/text) — where the raw string already exists — for signature verification. **Streamed content types (multipart, binary) forgo `rawBody`.**

## Consequences

- **Multipart webhook signature verification is dropped.** Verifying a signature over a multipart body requires the raw bytes, which is exactly what streaming avoids. Binary already discarded `rawBody`; multipart previously forwarded it. Accepted trade — HMAC-over-file-upload is rare.
- All three multipart consumers now consume explicitly; there is no global `request.body.<field>` magic for multipart. New multipart routes must call `request.file()`/`request.parts()`.
- Streams to S3 only when `FILE_STORAGE_LOCATION=S3`; DB storage buffers to `bytea` (a stream can't stream into a column).
- Size is enforced app-side per streamed part via `enforceByteLimit` (`MAX_FILE_SIZE_MB`).
- JSON/XML/form/text signature verification is unchanged — same raw bytes, captured one layer down.
