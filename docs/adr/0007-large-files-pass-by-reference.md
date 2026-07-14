# Large files pass by reference; bytes never transit Activepieces processes

Large-file support is built on pass-by-reference, not on streaming bytes through our servers: a file lives in object storage, flow steps exchange a File Reference (a readUrl string, surfaced to pieces as `ApFileRef`), and the byte-touching edges move data straight into S3. Streaming-through-server was rejected because three boundaries make it impossible anyway — the public `ApFile.data: Buffer` SDK contract, the JSON-serialized worker↔engine Socket.io RPC (`maxHttpBufferSize`-capped), and `isolated-vm` code steps (128MB, structured-clone only, cannot hold a stream).

There are two byte-touching legs, and **who holds the S3 credentials decides the mechanism**:

- **Engine → S3 (piece `ctx.files.write` of a stream).** The sandboxed engine has no S3 credentials, so it uploads via a **single presigned PUT** minted by the API. The caller must declare `size`, because a plain PUT needs `Content-Length` up front (S3-compatible providers reject `Transfer-Encoding: chunked`); knowing the size lets the engine stream the body with bounded memory and no disk. Stream writes with no declared size are rejected — the honest cost of dropping multipart. S3's 5 GB single-PUT ceiling is well above `AP_MAX_STREAM_FILE_SIZE_MB`.
- **Inbound webhook → S3 (`saveStream`).** The API server holds the credentials, so it PUTs directly with the AWS SDK. A raw binary body carries a `Content-Length`, so it streams through in a single `PutObject`; a body of unknown length (multipart form-data parts) is buffered under `AP_MAX_FILE_SIZE_MB` instead. A presigned URL would be pointless here (the API would mint a capability for itself) and can't be pushed onto the external sender.

Streaming is its own capability, gated only on `AP_FILE_STORAGE_LOCATION=S3`. It is deliberately independent of `AP_S3_USE_SIGNED_URLS`, which keeps governing only the legacy proxy-redirect behavior of `PUT/GET /v1/files/:id` and keeps its opt-in default — flipping it on upgrade would break S3 installs whose bucket is reachable only from the API server.

## Considered Options

- **Stream bytes through the API/worker** (rejected): dies at the three boundaries above; also puts every large transfer on our processes' memory and bandwidth.
- **Require object storage in the default self-host footprint** (rejected): violates the zero-setup self-hosting rule. DB-only installs instead keep the buffered `ctx.files.write` path with the `AP_MAX_FILE_SIZE_MB` cap as an honest fallback.
- **Pass-by-reference with presigned S3 URLs** (chosen): the engine RPC and the builder already carry files as URL strings, so only the byte-touching edges change.
- **Presigned multipart on the engine leg** (rejected, was the first implementation): a multipart handshake (create → per-part presigned URL → complete/abort) let the engine stream unknown-length data. It was replaced by a single presigned PUT once `size` became a required part of the stream contract — S3 caps a single PUT at 5 GB, above our stream limit, so multipart bought nothing but a four-endpoint handshake and hand-rolled part orchestration.
- **Multipart on the webhook leg** (rejected, was the first implementation): the API server-side multipart handshake (`createMultipartUpload`/`uploadPart`/`complete`/`abort`) was dropped for a single `PutObject` with the request's `Content-Length`, buffering under the file cap when the length is unknown. Streaming *unknown-length* data to S3 genuinely needs multipart, but that capability wasn't worth a hand-rolled handshake — nor an extra SDK dependency (`@aws-sdk/lib-storage` was evaluated) — for the rare unbounded webhook upload.

## Consequences

- Code steps can never stream — an `ApFileRef` reaching one is structured-cloned to plain `{ url, filename, ... }` data; user code fetches the URL itself.
- Presigned URLs are bearer capabilities: short expiry, minted fresh per use, never logged.
- `ApFile.data: Buffer` is deprecated but must never be removed — hundreds of community pieces depend on it; streaming is opt-in per property (`Property.File({ stream: true })`).
- Streaming a piece output requires a caller-declared byte `size`. Sources that cannot know their length up front (on-the-fly generation, compression, chunked upstreams) must buffer under `AP_MAX_FILE_SIZE_MB` or are unsupported — a deliberate capability trade for not carrying multipart.
- The engine streaming PUT is not retryable (a consumed stream can't be replayed) and tolerates an orphaned file row if it fails mid-upload, reaped by the retention job — the same contract as the buffered signed-redirect path.
