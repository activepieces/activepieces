---
status: accepted
---

# Streaming file inputs resolve to a lazy ApStreamingFile

## Decision
`Property.File({ streaming: true })` resolves to `ApStreamingFile = { filename, extension?, size?, body: Readable }` instead of `ApFile`. The engine's `fileProcessor` branches on the flag: a URL input is `fetch`ed and its **undrained** response body exposed as a Node `Readable` (`Readable.fromWeb`) with `size` from `Content-Length`; a base64 data URL decodes to a one-shot `Readable` with an exact `size`. It reuses the same `PropertyType.FILE`, so the frontend file picker is unchanged. Plain `Property.File()` still returns a buffered `ApFile`.

## Context
A piece that uploads a large file to an external service (Amazon S3, Dropbox, Google Drive, …) declared its input as `Property.File()` and received an `ApFile` — which the engine produced by buffering the **entire** file into a `Buffer` (unbounded `arrayBuffer()` on the URL path) before `run()` was even called. The upload then streamed from that in-memory buffer, so the peak-RAM win of streaming was already lost upstream. This resolves the "Property.file streaming (read side)" item that [000008](000008-streaming-file-writes-go-through-the-app-one-path.md) deferred as YAGNI, now that concrete large-file upload pieces need it.

## Why
`ApStreamingFile` is a plain type, not a class like `ApFile` (which carries a `base64` getter over its `Buffer`): a one-shot body can be read exactly once and has no replayable representation, so there is nothing for methods to wrap. The S3 consumer uses `putObject({ Body, ContentLength })` rather than `@aws-sdk/lib-storage` — the write side needed `lib-storage` because `ctx.files.write` streams *unknown*-length bodies, but an upload source (URL `Content-Length` / base64 length) almost always reports a size, so a single streamed PUT works with **no new dependency** and byte-identical IAM (`s3:PutObject`) and ETag semantics; sources with no size fall back to buffering, exactly the pre-streaming behaviour. A flag on `Property.File` beat a separate `Property.StreamingFile` builder: the wire contract and renderer are identical either way, and the flag keeps both file shapes discoverable under one name (typed via overloads with the house `R extends true ? …` conditional-return pattern so `required` still narrows through `createAction`).

## Consequences
- The unconditional win is deleting the **unbounded** `arrayBuffer()` buffer on the URL input path. The additional peak-RAM win over the buffered path is marginal at the `AP_MAX_FILE_SIZE_MB` default (25 MB) and only material once that cap is raised or the source is an uncapped external URL.
- `size` is best-effort: absent/invalid `Content-Length` → `undefined` → the consumer buffers (backward-compatible fallback). It is **also** dropped when the response carries a `Content-Encoding` (gzip/br/deflate) — undici transparently decompresses the body but leaves the *compressed* `Content-Length` in place, so trusting it would understate the streamed byte count and silently truncate the destination object.
- There is **no `AP_MAX_FILE_SIZE_MB` ceiling** on the streamed URL input. Intentional — the feature exists to move large files, and the prior buffered path was likewise unbounded. A cap is deferred; it would need a counting pass-through stream that aborts past the limit.
- The `body` is **one-shot** — no whole-stream retry. The AWS SDK cannot replay a non-replayable `Readable`, so **any** failure once the PUT has started is non-retryable, not only mid-stream failures but also normally-retryable early ones (connection reset, throttling, HTTP 500). Whole-stream retry would require buffering, which defeats streaming.
- The URL `fetch` opens the source connection at **input-resolution time** (before `run()`), like the buffered path.
- SSRF posture is unchanged from the existing buffered `handleUrlFile`: the same raw `fetch` also legitimately retrieves AP's own internal http `readUrl`s, so the https-only + `redirect:'error'` guard used by external-only piece code (e.g. SimplyPrint) is deliberately **not** applied here.
