---
icon: 🧑‍✈️
---

# Platform Copilot

A backend-only RAG chat assistant that answers questions about the Activepieces platform itself — codebase, docs, config — aimed at developers building on Activepieces, not flow end-users. Enhances the query, retrieves from a pre-indexed vector+full-text store, and streams responses via the Vercel AI SDK UI message stream. All editions (no plan-flag guard); both endpoints require `publicPlatform` scope (any authenticated USER).

### Entities & services
- **copilot_code_chunks** — parsed segments of the AP codebase/docs: `path`, `content`, `embedding` `vector(768)`, `embeddingModel` (filters queries so embeddings from different models don't mix), `chunkType` (`function`/`class`/`module`/`block`/`section`), `searchVector` `tsvector` (populated by a background UPDATE, not selected by default).
- `platformCopilotService.prepareChat` — enhance query → retrieve up to 8 chunks → load model → return `{ model, systemWithContext, messages }`.
- `platformCopilotIndexer.indexAll` — globs `.ts/.tsx`, `.md/.mdx`, `package.json` (excludes dist, node_modules, tests, pieces, secrets); parses via AST TS parser or MD heading parser; embeds in batches of 50; upserts + deletes stale rows.
- `copilotSearchService.search` — runs vector cosine (`<=>`, top 20) and PostgreSQL `plainto_tsquery` full-text concurrently, then RRF merge (70% vector, 30% text).

### How it works
- `POST /v1/platform-copilot/chat` — send message, returns UI message stream (SSE-like), capped at 5 LLM steps (`stepCountIs(5)`).
- `POST /v1/platform-copilot/index` — triggers async reindex (`{ status: "indexing_started" }`).
- Two model-callable tools execute at chat time (not indexed): `read_file` (fetches raw file from GitHub `main`) and `list_directory` (GitHub contents API, uses `GITHUB_TOKEN` if set).
- Index rebuilds on the weekly `COPILOT_INDEX_REFRESH` cron (`0 3 * * 0`, Sun 03:00 UTC), on demand via `/index`, or at startup when `hasChunks()` is false.

### Gotchas
- **Source is only compiled JS** — the TypeScript was compiled to `packages/server/api/dist/src/app/platform-copilot/`; no `.ts` sources.
- If no embedding model is configured (`createCopilotEmbeddingModel`), vector search is skipped and it falls back to full-text only.

### Key files
None. This feature has no code in the repo. Every path listed for it pointed into `packages/server/api/dist/src/app/platform-copilot/`, a build-output directory that does not exist, and no `platform-copilot` file, route, or symbol (`platformCopilotService`, `platformCopilotIndexer`, `copilotSearchService`, `copilot_code_chunks`, `createCopilotEmbeddingModel`) appears anywhere in the tree outside this page. The only live trace is the pair of migrations that retire it:

- `packages/server/api/src/app/database/migration/postgres/1761221158764-DeprecateCopilot.ts` — drops the `platform.copilotSettings` column (SQLite twin: `migration/sqlite/1761223879376-DeprecateCopilotSQLITE.ts`)

Paths verified 2026-07-17. All 9 previously listed paths were dead build-output pointers with no source equivalent to repair, so they were dropped rather than guessed at. Treat everything above this section as describing code that is no longer here.
