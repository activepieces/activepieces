# GoodMem for Activepieces

Store files and notes in [GoodMem](https://goodmem.ai), then find relevant passages from your Activepieces flows. GoodMem handles document extraction, chunking, and embeddings. This piece uses the official [TypeScript SDK](https://www.npmjs.com/package/@pairsystems/goodmem).

## Connect

You need a running GoodMem server, an API key, and an embedder configured on that server. See the [GoodMem documentation](https://docs.goodmem.ai/) for setup.

In the Activepieces action picker, search for **GoodMem**. Add a connection using your server's **Base URL** and **API Key**. The URL must be reachable from your Activepieces worker; `localhost` refers to the worker's own machine or container.

## Build a flow

1. **Create Space**, or select a space you already have. A single same-named space is reused when its embedder matches. If several accessible spaces share a name, select an explicit space ID in the memory actions. Existing chunking settings stay in place.
2. **Create Memory** from plain text or a file supplied by another step. Add source, author, tags, or your own metadata. Files retain their filename. By default, the action waits for that memory to finish indexing.
3. **Retrieve Memories** with a question and one or more spaces. Each result includes passage text, memory and chunk IDs, score, source, and metadata. An empty search returns immediately.

You can select a reranker without selecting an LLM. Add an LLM when you also want a generated answer. To restrict retrieval by metadata, use a filter such as:

```sql
CAST(val('$.tenant') AS text) = 'acme'
```

See the [filter reference](https://docs.goodmem.ai/docs/reference/filter-expressions/) for more examples.

**Chronological Resort** orders results oldest first. It currently requires successful reranking because the server otherwise returns its original order.

**Get Memory** returns metadata plus readable `content` using the declared text encoding (UTF-8 by default), or a `file` URL for binary content. Unsupported or invalid text encodings produce `partial` and `contentError`. **Delete Memory** permanently removes a memory.

## Handle incomplete work

After a write, check `indexing.ready`. If indexing fails or the wait expires, the action still returns the accepted `memoryId`; use Get Memory to check its processing status instead of uploading again.

Retrieval returns the last completed result stage. An unfinished stream preserves available results with `partial` and an `INCOMPLETE_RESULT_SET` status. Server `statuses` also identify degraded results. HTTP and malformed-response errors fail the step, allowing Activepieces error handling and retries to work.

## Upgrading from 0.0.x

- Move **Wait for Indexing** from Retrieve Memories to Create Memory.
- Handle failed steps through Activepieces instead of checking `success: false`.
- Read downloaded text from `content` and binary files from `file`.
- Check `partial`, and verify `indexing.ready` before searching newly written content.
