# Changelog

## 0.1.0 (unreleased)

- Use `@pairsystems/goodmem` 0.1.5 for authentication, API operations, pagination, uploads, downloads, and streaming responses.
- Fix retrieval of chunk text, IDs, scores, and source metadata. Preserve server statuses and mark degraded results `partial`.
- Return the final completed retrieval stage without mixing candidate and reranked scores. Mark unfinished streams partial, retaining usable results.
- Fail workflow steps on HTTP and malformed-response errors instead of returning an ordinary `success: false` output.
- Remove empty-search polling. Create Memory can wait for its accepted memory ID, returning the ID and indexing state when processing fails or the wait expires.
- Add native GoodMem metadata filters to retrieval. Chronological sorting requires successful reranking to match current server behavior; an LLM is optional.
- Require a reranker when using a relevance threshold and describe its model-dependent score range.
- Follow all pages in space selectors and same-name lookup. Reject ambiguous names and reuse with a different embedder; respect zero chunk overlap.
- Return readable text or an Activepieces file URL from Get Memory. Preserve metadata with a partial flag when downloading content fails.
- Respect declared text encodings and report unsupported or invalid encodings instead of replacing characters silently.
- Classify indexing deadlines consistently during waits and HTTP requests. Use native file bytes for uploads.
- Add regression tests using the real SDK and Activepieces contexts against a mock HTTP server.
- Run the regression suite in PR CI, changed-piece validation, and release checks.
