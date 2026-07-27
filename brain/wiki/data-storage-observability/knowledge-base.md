---
icon: 📚
---

# Knowledge Base

A project-scoped document store: users upload PDF/DOCX/TXT/CSV files, which are split into text chunks, optionally embedded with a 768-dim vector model, and stored for semantic similarity search. Agents search one or more KB files to retrieve context. All editions; requires `READ_KNOWLEDGE_BASE`/`WRITE_KNOWLEDGE_BASE` permissions, and an AI provider for embedding generation.

### Entities & services
- **knowledge_base_file** — links a project, a stored `file` record, and a `displayName` (unique `fileId`).
- **knowledge_base_chunk** — `content`, `chunkIndex` (0-based), `embedding` `vector(768)` (nullable), `metadata` JSONB; indexed on `(projectId, knowledgeBaseFileId)`.
- `knowledgeBaseService`: `createFile`, `extractChunks`, `storeChunks`, `ingestFile` (extract → embed in batches of 50 → store), `search` (raw SQL cosine `<=>`), `listChunks`, `deleteFile`.
- Files under `packages/server/api/src/app/knowledge-base/`.

### How it works
- REST under `/v1/knowledge-base/files`: register existing file, `upload` (upload + synchronously extract+store chunks), list, delete, `.../chunks/count`, `.../extract-chunks`, `.../store-chunks`, `.../chunks`, and `.../search` (cosine similarity, scored, optional `similarityThreshold`).
- Chunking: plain text/DOCX/PDF use a 2000-char sliding window with 200-char overlap; CSV repeats the header row in each chunk to preserve column context.
- Extractors: `unpdf` (PDF), `mammoth` (DOCX), plain text.

### Gotchas
- **pgvector is not created by a migration** — the `AddPgVectorExtension` migration is a no-op because `CREATE EXTENSION` crash-loops managed Postgres where the app user lacks privileges.
- Instead `knowledgeBaseSeed` runs `knowledgeBaseSchema.ensure()` on **every boot** (under the migration lock, wrapped in `tryCatch`): creates the extension + table + indexes when available, else skips silently. Installing pgvector later activates KB on the next restart, no redeploy. PGLite bundles pgvector so CE works out of the box.
- Gating: backend `preHandler` throws `FEATURE_DISABLED` when the extension is absent (cached once observed); frontend hides the UI via the `PGVECTOR_AVAILABLE` flag.
- Allowed MIME types (`KB_ALLOWED_MIME_TYPES`): PDF, plain text, CSV, DOCX only.

### Key files
Entry point: `knowledgeBaseModule`, registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/knowledge-base/` — the whole backend slice: module, controller, service, both entities, and the pgvector schema check
- `packages/server/api/src/app/database/seeds/knowledge-base-seed.ts` — the boot-time `ensure()` that creates the extension and table
- `packages/core/shared/src/lib/automation/knowledge-base/` — shared zod schemas
- `packages/web/src/features/agents/agent-tools/` — frontend API client, hooks, and the `KnowledgeBaseSection` component
- `packages/server/api/src/app/flags/flag.service.ts` — computes the `PGVECTOR_AVAILABLE` flag the UI gates on
- `packages/server/api/test/unit/app/knowledge-base/` and `packages/server/api/test/integration/ce/knowledge-base/` — service, validation, and upload tests

Paths verified 2026-07-17.
