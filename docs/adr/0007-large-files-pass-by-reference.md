# Large files pass by reference; bytes never transit Activepieces processes

Large-file support is built on pass-by-reference, not on streaming bytes through our servers: a file lives in object storage, flow steps exchange a File Reference (a readUrl string, surfaced to pieces as `ApFileRef`), and the one piece that touches bytes moves them directly engine↔S3 via presigned multipart URLs minted by the API. Streaming-through-server was rejected because three boundaries make it impossible anyway — the public `ApFile.data: Buffer` SDK contract, the JSON-serialized worker↔engine Socket.io RPC (`maxHttpBufferSize`-capped), and `isolated-vm` code steps (128MB, structured-clone only, cannot hold a stream).

Streaming is its own capability, gated only on `AP_FILE_STORAGE_LOCATION=S3`. It is deliberately independent of `AP_S3_USE_SIGNED_URLS`, which keeps governing only the legacy proxy-redirect behavior of `PUT/GET /v1/files/:id` and keeps its opt-in default — flipping it on upgrade would break S3 installs whose bucket is reachable only from the API server.

## Considered Options

- **Stream bytes through the API/worker** (rejected): dies at the three boundaries above; also puts every large transfer on our processes' memory and bandwidth.
- **Require object storage in the default self-host footprint** (rejected): violates the zero-setup self-hosting rule. DB-only installs instead keep the buffered `ctx.files.write` path with the `AP_MAX_FILE_SIZE_MB` cap as an honest fallback.
- **Pass-by-reference with presigned S3 URLs** (chosen): the engine RPC and the builder already carry files as URL strings, so only the byte-touching edges change.

## Consequences

- Code steps can never stream — an `ApFileRef` reaching one is structured-cloned to plain `{ url, filename, ... }` data; user code fetches the URL itself.
- Presigned URLs are bearer capabilities: short expiry, minted fresh per use, never logged.
- `ApFile.data: Buffer` is deprecated but must never be removed — hundreds of community pieces depend on it; streaming is opt-in per property (`Property.File({ stream: true })`).
