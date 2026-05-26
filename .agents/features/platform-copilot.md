# Platform Copilot (AI Flow Building Assistant)

## Summary
Platform Copilot is a backend-only RAG (Retrieval-Augmented Generation) chat assistant that answers questions about the Activepieces platform — codebase, documentation, and configuration. It is designed to help developers building on Activepieces rather than end users of flows. The assistant enhances user queries with semantic expansion, retrieves relevant code and docs snippets from a pre-indexed vector+full-text store (`copilot_code_chunks`), and streams responses via the Vercel AI SDK UI message stream protocol. It has two tools the model can call: `read_file` (fetch raw file from GitHub) and `list_directory` (browse repo via GitHub API). The index is rebuilt on a weekly cron or on demand.

Note: The source TypeScript files were compiled to `dist/` — the source is only available as compiled JS in `packages/server/api/dist/src/app/platform-copilot/`.

## Key Files
- `packages/server/api/dist/src/app/platform-copilot/platform-copilot.controller.js` — POST `/chat` (streaming) and POST `/index` (reindex trigger)
- `packages/server/api/dist/src/app/platform-copilot/platform-copilot.service.js` — `prepareChat`: query enhancement + context retrieval + model setup
- `packages/server/api/dist/src/app/platform-copilot/platform-copilot-indexer.js` — `indexAll`: glob repo files → parse → embed in batches → upsert to DB; `reindex`, `clearIndex`, `hasChunks`
- `packages/server/api/dist/src/app/platform-copilot/copilot-search.service.js` — hybrid search: vector cosine (`<=>`) + PostgreSQL `tsvector` full-text; RRF-style merge (70% vector, 30% text)
- `packages/server/api/dist/src/app/platform-copilot/platform-copilot-tools.js` — `createCopilotTools`: AI SDK `tool()` definitions for `read_file` and `list_directory`
- `packages/server/api/dist/src/app/platform-copilot/copilot-code-chunk.entity.js` — `copilot_code_chunks` entity
- `packages/server/api/dist/src/app/platform-copilot/copilot-ts-parser.js` — AST-based TypeScript/JavaScript chunk extractor (functions, classes, exports)
- `packages/server/api/dist/src/app/platform-copilot/copilot-md-parser.js` — Markdown/MDX heading-based chunk extractor
- `packages/server/api/dist/src/app/platform-copilot/platform-copilot.module.js` — module registration; registers `COPILOT_INDEX_REFRESH` system job (weekly cron `0 3 * * 0`)

## Edition Availability
All editions (no plan flag guard on the controller). Both endpoints require `publicPlatform` scope (any authenticated USER). The feature depends on an embedding model being available (configured via `createCopilotEmbeddingModel`); if none is configured, vector search is skipped and only full-text search is used.

## Domain Terms
- **copilot_code_chunks** — the vector index table holding parsed segments of the Activepieces codebase and docs
- **chunkType** — classification of the segment: `function`, `class`, `module`, `block`, `section`, etc.
- **searchVector** — PostgreSQL `tsvector` column (populated by a background UPDATE after indexing) for full-text search
- **embeddingModel** — the model ID used to generate the embedding; used as a filter in vector queries to avoid mixing embeddings from different models
- **SYSTEM_PROMPT** — the fixed system message defining the assistant persona, tool usage rules, and response format guidelines
- **ENHANCE_PROMPT** — a separate system prompt used in a pre-chat LLM call to expand/fix the user's query before retrieval

## Entity

### `copilot_code_chunks` (`CopilotCodeChunkEntity`)
| Column | Type | Notes |
|---|---|---|
| id | string | ApId |
| path | text | relative file path from repo root |
| language | string (nullable) | `typescript`, `markdown`, `json`, etc. |
| content | text | raw text of the chunk |
| summary | text (nullable) | optional LLM-generated summary |
| embedding | vector(768) (nullable) | 768-dim embedding |
| embeddingModel | string (nullable) | model ID that produced the embedding |
| startLine | number | 1-based line start in source file |
| endLine | number | 1-based line end |
| functionName | string (nullable) | if chunk is a function |
| className | string (nullable) | if chunk is inside a class |
| chunkType | string | `function`, `class`, `block`, `module`, `section` |
| tokens | number (nullable) | estimated token count (`content.length / 4`) |
| searchVector | tsvector (nullable) | full-text index; not selected by default |

Index on `path`.

## Endpoints

| Method | Path | Security | Description |
|---|---|---|---|
| POST | `/v1/platform-copilot/chat` | publicPlatform (USER) | Send a message; returns UI message stream (SSE-like); max 5 LLM steps |
| POST | `/v1/platform-copilot/index` | publicPlatform (USER) | Trigger async re-indexing of codebase; returns `{ status: "indexing_started" }` |

### Chat Request Body
```json
{
  "message": "string (min 1)",
  "conversationHistory": [{ "role": "user|assistant", "content": "string" }],
  "modelId": "string (optional)",
  "provider": "string (optional)"
}
```

## Service Methods

### `platformCopilotService`
- `prepareChat({ platformId, message, conversationHistory, modelId?, provider? })` — (1) enhances query via `enhanceQuery`, (2) retrieves up to 8 context chunks via `copilotSearchService.search`, (3) loads model via `createPlatformCopilotModel`, (4) returns `{ model, systemWithContext, messages }`

### `platformCopilotIndexer`
- `indexAll()` — globs `.ts/.tsx`, `.md/.mdx`, `package.json` files (excludes dist, node_modules, tests, pieces, secrets); parses with `copilotTsParser` or `copilotMdParser`; embeds in batches of 50; upserts to `copilot_code_chunks`; updates `searchVector` for new rows; deletes stale rows
- `reindex()` — alias for `indexAll()`; idempotent (skips if already running via `indexingInProgress` set)
- `clearIndex()` — truncates table
- `hasChunks()` — returns boolean for startup check

### `copilotSearchService`
- `search({ query, limit })` — runs vector search (top 20 by `<=>`) and text search (`plainto_tsquery`) concurrently; merges using RRF weights (70% vector, 30% normalized text rank); returns top `limit` results

## AI SDK Integration
The controller uses `@vercel/ai` (`streamText`, `createUIMessageStream`, `pipeUIMessageStreamToResponse`). The stream is hijacked from Fastify's reply and written directly to the raw HTTP response using `UI_MESSAGE_STREAM_HEADERS`. The model is capped at `stepCountIs(5)` to limit tool-call loops.

## Copilot Tools
Both tools execute at chat time (not indexed):
- **`read_file`** — fetches `https://raw.githubusercontent.com/activepieces/activepieces/main/{filePath}` and returns full content
- **`list_directory`** — calls `https://api.github.com/repos/activepieces/activepieces/contents/{dirPath}?ref=main`; uses `GITHUB_TOKEN` env var if available

## Indexing Schedule
The `COPILOT_INDEX_REFRESH` system job runs weekly at `0 3 * * 0` (Sunday 03:00 UTC). It can also be triggered manually via the `/index` endpoint or at startup if `hasChunks()` returns false (this startup trigger is done by the module registration).
