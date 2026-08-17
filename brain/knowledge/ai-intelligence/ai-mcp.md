---
icon: 🤖
---

# AI & MCP

How Activepieces' AI and MCP surfaces fit together. One subsection per feature.

### MCP

Exposes a project as a Model Context Protocol server so AI clients (Claude Desktop, Cursor, agent piece) can drive flows/tables/connections/runs via typed tools.

- **Entities/services**: one `McpServer` per project (UNIQUE projectId, 72-char bearer token, `disabledTools[]` JSONB). `mcp-service.ts` builds the server per-request; `mcp-server-controller.ts` for endpoints.
- **Tools**: locked (always-on reads: list/structure/validate/research pieces) + controllable (toggleable writes: create/build/publish flows, tables, runs) + dynamic flow-tools (any flow using the `@activepieces/piece-mcp` trigger, named `{toolName}_{flowId[0..4]}`).
- **Integration/gotchas**: auth via Bearer or `?token=`; OAuth 2.0 PKCE for clients that need it. StreamableHTTP is the main endpoint (`/v1/mcp/:projectId/http`). All editions. `x-ap-conversation-id` header lets EE chat re-scope the server to a conversation's project (token-scoped so it can't widen access). 401s carry RFC 9728 `WWW-Authenticate` for discovery.

### AI Providers

Platform admins configure LLM backends for AI pieces; auto-provisions an "Activepieces" provider (via OpenRouter) when `aiCreditsEnabled` is set.

- **Entity/services**: `AIProvider` (platform-scoped, UNIQUE per (platform, provider); `auth` is AES-256 encrypted at rest, decrypted only for engine). 8 providers: openai, anthropic, google, azure, openrouter, cloudflare-gateway, custom, activepieces.
- **Integration/gotchas**: EE + Cloud only (not CE). Credits: 1000 = $1, metered via OpenRouter, monthly reset + Stripe auto-top-up via system job. Engine fetches creds at run time from `GET /v1/ai-providers/{provider}/config`. Models cached in-memory, cleared daily at midnight.
- **Sibling**: `AiToolConfig` (same folder, distinct) gives the chat assistant capabilities — WEB_SEARCH/WEB_SCRAPING/IMAGE_GENERATION — via Tavily/Firecrawl/Apify/Fal keys (`/v1/ai-tools`, EE/Cloud, platform-admin only).

### Chat

Platform-level AI assistant that manages projects via natural language, streaming over WebSocket and using the project's MCP server as its tool surface.

- **Execution model (key gotcha)**: the LLM loop runs in the **worker**, not the API. Controller enqueues `EXECUTE_CHAT_AGENT` → worker `run-chat-turn.ts` runs `streamText()` → chunks stream back via RPC → `CHAT_MESSAGE_CHUNK` websocket (filtered by `runId`). `chat-service.ts` only does conversation CRUD.
- **Entities**: `ChatConversation` (per platform+user, optional project scope, messages as JSONB `ModelMessage[]`, compaction summary). `chat_rollout_user` tracks the cloud beta cohort (capped at 200 distinct users who sent a message).
- **Integration/gotchas**: EE/Cloud only (needs `chatEnabled`, or cloud rollout/grandfather); refuses PGLite dev DB — needs Postgres + Redis. Two-phase (discovery/build) tool gating; Redis pub/sub approval gates for display cards + write-action previews; MCP tools no longer gated (just timeout-wrapped). Server-managed connections — LLM never sees credential externalIds. Web search rides the configured LLM credential (no second BYOK).

### Knowledge Base

Project-scoped document store (PDF/DOCX/TXT/CSV) → text chunks → optional 768-dim embeddings → semantic search for agents.

- **Entities**: `knowledge_base_file` + `knowledge_base_chunk` (`vector(768)` embedding, cosine `<=>` search). REST under `/v1/knowledge-base/files`.
- **Integration/gotchas**: needs the Postgres `vector` (pgvector) extension. NOT created by migration (`CREATE EXTENSION` crash-loops managed PG) — instead a self-healing seed (`knowledgeBaseSchema.ensure()`) runs every boot and skips silently if unavailable; installing pgvector later activates KB on next restart. Frontend gated by `PGVECTOR_AVAILABLE` flag. All editions; PGLite bundles pgvector so CE works out of the box. Chunking: 2000 chars / 200 overlap (CSV repeats header per chunk).

### Platform Copilot

Backend-only RAG chat that answers questions about the Activepieces platform (codebase + docs) — for developers building on AP, not flow end-users.

- **Entity/services**: `copilot_code_chunks` (vector(768) + `tsvector` full-text). Hybrid search = RRF merge of vector cosine (70%) + Postgres full-text (30%). `read_file` + `list_directory` tools hit GitHub raw/API at chat time.
- **Integration/gotchas**: source lives only as compiled JS under `.../dist/src/app/platform-copilot/`. All editions, any authenticated USER (`publicPlatform`). Index rebuilt weekly (`COPILOT_INDEX_REFRESH`, Sun 03:00 UTC) or via `/index` / at startup if empty. Streams via Vercel AI SDK UI message protocol, capped at 5 LLM steps.
