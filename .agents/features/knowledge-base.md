# Knowledge Base

## Summary
The Knowledge Base feature lets users upload documents (PDF, DOCX, TXT, CSV) into a project-scoped store. Uploaded files are split into text chunks, optionally embedded with a 768-dimensional vector model, and stored alongside their embeddings. Agents can then perform semantic similarity search over one or more knowledge-base files to retrieve relevant context. The feature consists of two database entities (`knowledge_base_file` and `knowledge_base_chunk`), a REST API under `/v1/knowledge-base/files`, and a small frontend UI embedded within the agent tool dialogs.

## Key Files
- `packages/server/api/src/app/knowledge-base/knowledge-base.controller.ts` — all routes under `/v1/knowledge-base/files`
- `packages/server/api/src/app/knowledge-base/knowledge-base.service.ts` — service: `createFile`, `uploadAndIngest`, `extractChunks`, `storeChunks`, `search`, `listFiles`, `deleteFile`, `getChunkCount`, `listChunks`
- `packages/server/api/src/app/knowledge-base/knowledge-base-file.entity.ts` — `knowledge_base_file` entity
- `packages/server/api/src/app/knowledge-base/knowledge-base-chunk.entity.ts` — `knowledge_base_chunk` entity with `vector(768)` embedding column
- `packages/shared/src/lib/automation/knowledge-base/index.ts` — `KnowledgeBaseFile` Zod schema
- `packages/web/src/features/agents/agent-tools/knowledge-base-dialog/knowledge-base-api.ts` — frontend API client
- `packages/web/src/features/agents/agent-tools/knowledge-base-dialog/knowledge-base-hooks.ts` — React Query hooks
- `packages/web/src/features/agents/agent-tools/components/knowledge-base-tool.tsx` — `KnowledgeBaseSection` component rendered in agent tool list

## Edition Availability
All editions. Requires `Permission.READ_KNOWLEDGE_BASE` / `Permission.WRITE_KNOWLEDGE_BASE`. Semantic search requires pgvector extension in the PostgreSQL database. Embedding generation requires an AI provider configured via `createCopilotEmbeddingModel` (falls back to text-only search if vector unavailable).

## Domain Terms
- **KnowledgeBaseFile** — a record linking a project, a stored file (in the `file` table), and a display name
- **KnowledgeBaseChunk** — a text segment extracted from a file; optionally has a 768-dim vector embedding
- **chunkIndex** — 0-based position of the chunk within its source file
- **embedding** — stored as PostgreSQL `vector(768)` type; cosine distance (`<=>`) used for similarity search
- **CHUNK_SIZE_CHARS** — 2000 characters per chunk with 200-character overlap for plain text
- **KB_ALLOWED_MIME_TYPES** — `application/pdf`, `text/plain`, `text/csv`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

## Entity

### `knowledge_base_file` (`KnowledgeBaseFileEntity`)
| Column | Type | Notes |
|---|---|---|
| id | string | ApId |
| projectId | string | FK to `project` |
| fileId | string | FK to `file` (CASCADE delete) |
| displayName | string | user-provided name |

Indices: `projectId`, unique `fileId`.

### `knowledge_base_chunk` (`KnowledgeBaseChunkEntity`)
| Column | Type | Notes |
|---|---|---|
| id | string | ApId |
| projectId | string | filters by project |
| knowledgeBaseFileId | string | FK to `knowledge_base_file` (CASCADE) |
| content | text | raw text of the chunk |
| chunkIndex | number | position in file |
| embedding | vector(768) (nullable) | float vector; null if not yet embedded |
| metadata | jsonb | e.g. `{ chunkIndex, totalChunks }` |

Index on `(projectId, knowledgeBaseFileId)`.

## Endpoints

| Method | Path | Security | Description |
|---|---|---|---|
| POST | `/v1/knowledge-base/files` | project (USER,ENGINE,SERVICE, WRITE_KNOWLEDGE_BASE, BODY) | Register an existing file ID as a KB file (no upload) |
| POST | `/v1/knowledge-base/files/upload` | project (USER,ENGINE,SERVICE, WRITE_KNOWLEDGE_BASE, QUERY) | Upload a document, create KB record, and synchronously extract+store chunks |
| GET | `/v1/knowledge-base/files` | project (USER,ENGINE,SERVICE, READ_KNOWLEDGE_BASE, QUERY) | List all KB files for the project |
| DELETE | `/v1/knowledge-base/files/:id` | project (USER,ENGINE,SERVICE, WRITE_KNOWLEDGE_BASE, QUERY) | Delete KB file and all its chunks; also deletes the underlying `file` record |
| GET | `/v1/knowledge-base/files/:id/chunks/count` | project (READ_KNOWLEDGE_BASE, PARAM) | Return total chunk count |
| POST | `/v1/knowledge-base/files/:id/extract-chunks` | project (WRITE_KNOWLEDGE_BASE, PARAM) | Extract text chunks from the file without embedding |
| POST | `/v1/knowledge-base/files/:id/store-chunks` | project (WRITE_KNOWLEDGE_BASE, PARAM) | Insert new chunks or update existing chunks (by id) with content/embedding |
| GET | `/v1/knowledge-base/files/:id/chunks` | project (READ_KNOWLEDGE_BASE, PARAM) | List chunks; filter by `embedded=true/false` |
| POST | `/v1/knowledge-base/files/search` | project (READ_KNOWLEDGE_BASE, BODY) | Cosine similarity search over specified KB files; returns scored results |

## Service Methods

### `knowledgeBaseService`
- `createFile({ projectId, fileId, displayName })` — inserts a `knowledge_base_file` record
- `deleteFile({ projectId, id })` — deletes KB file record and calls `fileService.delete` for the underlying file
- `extractChunks({ projectId, knowledgeBaseFileId })` — reads file bytes from `fileService`, dispatches to format-specific extractor (`unpdf`, `mammoth`, or plain text), then applies `chunkText` or `chunkCsvText`
- `storeChunks({ projectId, knowledgeBaseFileId, chunks })` — inserts new chunks in batches of 100; updates existing chunks identified by `id`
- `ingestFile({ projectId, knowledgeBaseFileId, embedFn })` — full pipeline: extract chunks, call `embedFn` in batches of 50, store with embeddings
- `search({ projectId, knowledgeBaseFileIds, queryEmbedding, limit, similarityThreshold? })` — runs raw SQL `<=> vector` cosine distance query; optionally filters by `similarityThreshold`; returns `{ id, content, metadata, chunkIndex, score }[]`
- `listChunks({ projectId, knowledgeBaseFileId, embedded? })` — list chunks optionally filtered by embedding status
- `getChunkCount({ projectId, knowledgeBaseFileId })` — count of all chunks

## Text Chunking Strategy
- **Plain text / DOCX / PDF** — sliding window: 2000-char chunks with 200-char overlap
- **CSV** — header row repeated in each chunk; rows accumulated until 2000-char limit, then flushed; preserves column context in each chunk
