---
status: accepted
---

# Streaming file inputs resolve to a lazy ApStreamingFile

A piece that uploads a large file to an external service (Amazon S3, Dropbox, Google Drive, …) declared its input as `Property.File()` and received an `ApFile` — which the engine's `fileProcessor` produced by buffering the **entire** file into a `Buffer` (via `arrayBuffer()` for URL inputs, unbounded) before `run()` was even called. The upload then streamed from that in-memory buffer, so the peak-RAM win of streaming was already lost upstream.

**Decision.** Add an opt-in streaming file **input**: `Property.File({ streaming: true })` resolves to `ApStreamingFile = { filename, extension?, size?, body: Readable }` instead of `ApFile`. The engine's `fileProcessor` branches on the property's `streaming` flag: for a URL it `fetch`es and exposes the **undrained** response body as a Node `Readable` (`Readable.fromWeb`), deriving `size` from the `Content-Length` header; for a base64 data URL it decodes to a one-shot `Readable` with an exact `size`. It reuses the same `PropertyType.FILE`, so the frontend file picker is unchanged. This resolves the "Property.file streaming (read side)" item that [ADR-0007](0007-streaming-files-use-presigned-multipart-not-app-relay.md) deferred as YAGNI, now that concrete large-file upload pieces need it.

## Considered options

- **`ApStreamingFile` as a plain type, not a class (chosen).** Unlike `ApFile` (which carries a `base64` getter over its `Buffer`), a streaming file is a one-shot data carrier — the `body` can be read exactly once and has no replayable representation, so there is nothing for methods to wrap.
- **`putObject({ Body, ContentLength })`, not `@aws-sdk/lib-storage` (chosen for the S3 consumer).** The write-side (ADR-0007) needed `lib-storage` because `ctx.files.write` streams *unknown*-length bodies. The upload-*to-external* side is the opposite: the source (URL `Content-Length` / base64 length) almost always reports a size, so a single streamed PUT works with **no new dependency** and byte-identical IAM (`s3:PutObject`) and ETag semantics. Sources with no size fall back to buffering — exactly the pre-streaming behaviour — so no upload that worked before breaks.
- **A streaming flag on `Property.File` vs. a separate `Property.StreamingFile` builder.** Chose the flag: the wire contract (`PropertyType.FILE`) and the frontend renderer are identical either way, and the flag keeps the two file shapes discoverable under one name. Typed via overloads with the house `R extends true ? …` conditional-return pattern so `required` still narrows through `createAction`.

## Consequences

- The unconditional win is deleting the **unbounded** `arrayBuffer()` buffer on the URL input path. The additional peak-RAM win over the buffered path is marginal at the `AP_MAX_FILE_SIZE_MB` default (25 MB) and only material once that cap is raised or the source is an uncapped external URL.
- `size` is best-effort: absent/invalid `Content-Length` → `undefined` → the consumer buffers (backward-compatible fallback). It is **also** dropped to `undefined` when the response carries a `Content-Encoding` (gzip/br/deflate): undici transparently decompresses the body but leaves the *compressed* `Content-Length` in place, so trusting it would understate the streamed byte count and silently truncate the destination object.
- There is **no `AP_MAX_FILE_SIZE_MB` ceiling** on the streamed URL input. This is intentional — the feature exists to move large files, and the prior buffered path (`arrayBuffer()`) was likewise unbounded. Enforcing a cap is deferred (YAGNI); it would require a counting pass-through stream that aborts past the limit.
- The `body` is **one-shot** — no whole-stream retry. Because it is a non-replayable `Readable`, the AWS SDK cannot replay it, so **any** failure once the PUT has started is non-retryable — not only mid-stream failures but also normally-retryable early ones (connection reset, throttling, HTTP 500). Whole-stream retry would require buffering the body, which defeats streaming.
- The URL `fetch` opens the source connection at **input-resolution time** (before `run()`), like the buffered path.
- SSRF posture is unchanged from the existing buffered `handleUrlFile`: the same raw `fetch` that also legitimately retrieves AP's own http internal `readUrl`s, so the https-only + `redirect:'error'` guard used by external-only piece code (e.g. SimplyPrint) is deliberately **not** applied here.
