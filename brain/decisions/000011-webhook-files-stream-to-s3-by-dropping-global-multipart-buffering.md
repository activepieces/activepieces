---
status: accepted
---

# Webhook files stream to S3 by dropping global multipart buffering

## Decision
Inbound webhook files (multipart parts and raw-binary bodies) stream straight to S3 instead of being buffered whole in the app. `@fastify/multipart`'s global `attachFieldsToBody` is dropped: the webhook route streams via `request.parts()`, and routes that need the whole file in memory attach the `attachMultipartFieldsToBody` preValidation hook themselves. `fastify-raw-body` no longer covers webhook routes. Instead a `preParsing` hook on the webhook module captures `rawBody` for the string-parsed content types (JSON/XML/form/text) and leaves multipart and binary streams untouched.

## Context
A third-party inbound POST can't be redirected, so its bytes must transit the app. The only lever is to stop accumulating them. Two pieces of shared infra buffered every webhook body globally and defeated streaming: `attachFieldsToBody`, whose preValidation hook buffered every part of every request with no per-route opt-out, and `fastify-raw-body`, which buffered the whole payload before parsing.

## Why
A webhook-only streaming multipart parser would mean reimplementing multipart parsing, a new abstraction. Dropping the global hook and letting each route choose how to read its parts is less code and can't silently defeat webhook streaming. Same logic for rawBody: capture it only where the body is small and already read as a string, rather than buffering everything and throwing most of it away.

## Consequences
Multipart webhook signature verification is dropped. Verifying over a multipart body needs the raw bytes that streaming avoids (accepted, HMAC-over-file-upload is rare). Streamed types get no `rawBody`; JSON/XML/form/text signature verification is unchanged. Every multipart route now opts in explicitly, via the hook or `request.file()`, or its body validation fails. Streams only when `FILE_STORAGE_LOCATION=S3` (DB storage buffers to `bytea`). Size is enforced on two paths: oversized multipart parts are caught via busboy's `truncated` flag at end-of-stream, and raw-binary bodies pipe through `enforceByteLimit`. `fastify-raw-body` is still registered with an empty `routes: []`, so it is attached to nothing but not yet removed from the dependency list.
