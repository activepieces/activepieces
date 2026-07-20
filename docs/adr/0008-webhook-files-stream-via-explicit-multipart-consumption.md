---
status: accepted
---

# Webhook files stream to S3 by dropping the global multipart buffering

Inbound webhook files (multipart parts and raw-binary bodies) stream straight to S3 instead of being buffered whole in the app. Because an inbound third-party POST cannot be redirected, its bytes must transit the app — so the only lever is to stop *accumulating* them. This reuses the write-path primitives (`fileService.save({ data: Readable })`, `s3Helper.uploadStream`, `enforceByteLimit`; see [ADR-0007](0007-streaming-files-use-presigned-multipart-not-app-relay.md)).

Two pieces of shared infrastructure buffered every webhook body and had to change:

1. **`@fastify/multipart`'s `attachFieldsToBody`** is plugin-global with no per-route opt-out — its `preValidation` hook buffers every part of every multipart request into `request.body`. A webhook-only streaming parser would mean reimplementing multipart parsing (a new abstraction). Instead we **drop `attachFieldsToBody` entirely** and let each multipart consumer decide how to read its parts:
   - **Streaming** — the webhook route consumes `request.parts()` and streams file parts straight to S3.
   - **Explicit buffering** — `users` (profile picture) and `knowledge-base` read via `request.file()`.
   - **Buffered `ApMultipartFile` body** — piece install (CE + EE) and the platform logo upload have Zod schemas expecting files as `ApMultipartFile` on `request.body`. They keep that shape via `attachMultipartFieldsToBody`, a `preValidation` hook attached **per route** (`helper/multipart-body.ts`). This is the old global behaviour, scoped to the routes that actually want the whole file in memory.

   The point is not that buffering disappears — some routes legitimately need the whole file — but that it is no longer *global*, so it can't silently defeat webhook streaming.

2. **`fastify-raw-body`** (`config.rawBody: true`, `runFirst: true`) buffered the entire raw payload before parsing, so streaming was impossible while it ran. We drop it from webhook routes and instead capture `rawBody` inside the `parseAs: 'string'` content-type parsers (JSON/XML/form/text) — where the raw string already exists — for signature verification. **Streamed content types (multipart, binary) forgo `rawBody`.**

## Consequences

- **Multipart webhook signature verification is dropped.** Verifying a signature over a multipart body requires the raw bytes, which is exactly what streaming avoids. Binary already discarded `rawBody`; multipart previously forwarded it. Accepted trade — HMAC-over-file-upload is rare.
- Every multipart consumer now opts in explicitly; there is no global `request.body.<field>` magic. A new multipart route must either call `request.file()`/`request.parts()`, or attach `attachMultipartFieldsToBody` if its schema expects `ApMultipartFile` on the body — otherwise its body validation fails.
- Streams to S3 only when `FILE_STORAGE_LOCATION=S3`; DB storage buffers to `bytea` (a stream can't stream into a column).
- Size is enforced app-side per streamed part against `MAX_FILE_SIZE_MB`: binary bodies pipe through `enforceByteLimit`, while multipart relies on busboy's `limits.fileSize`. Busboy ends an oversized part's stream *cleanly* and flags `truncated` rather than erroring it, so the webhook path checks `truncated` at end-of-stream and fails the upload — otherwise truncated bytes would be persisted before `@fastify/multipart` surfaces its 413.
- JSON/XML/form/text signature verification is unchanged — same raw bytes, captured one layer down.
