---
icon: 🧩
---

# Pieces & Engine

How the piece catalog, visibility, formulas, workers, and AI agents fit together.

### Pieces

Metadata catalog of integrations (`@activepieces/piece-*`), served from an in-memory `pieceCache` rebuilt from the `piece_metadata` table and refreshed via pub/sub.

- **Entities/services**: `piece_metadata` (unique on name+version+platformId; `null` platformId = official, set = custom); `pieceMetadataService` (list/get/create/delete + cache), `pieceInstallService` (upload/NPM install → `EXECUTE_METADATA` engine job), `pieceSyncService` (bundled registry → DB).
- **Gotchas**: routes under `/v1/pieces`; install/delete are `platformAdminOnly`; `options` runs dynamic prop eval on a worker. Per-piece/action visibility (EE/Cloud) resolved at read time by `resolveVisibility` → returns `null` on CE. Optional per-action `outputSchema` drives the builder's Smart Output Viewer (opt-in, non-breaking).

### Piece Sets (EE/Cloud only, `managePiecesEnabled`)

Named, reusable piece/action/trigger visibility config a platform admin assigns to many projects. Visibility is **derived at read time** — nothing written when a new piece installs.

- **Entities/services**: `piece_set` (jsonb `config` = include/exclude selection); `pieceSetService` (CRUD, per-platform Default set, project assignment via `project.pieceSetId`). Pure resolvers `isPieceVisible`/`isComponentVisible` shared by server + web.
- **Gotchas**: every platform has one un-deletable Default set; unassigned projects resolve to it. `include_all` auto-shows future pieces, `exclude_all` hides them. Replaces legacy per-project allow/block lists. Embed v4 JWT carries a `pieceSet` key claim (v2/v3 used `piecesTags`). No install-time sync method. Inert/zero-setup on CE.

### Formulas

User-facing data transforms (81+ functions) inside any builder text input via a `/` slash editor; saved inline as `ap-formula-v1::{<expr>}::ap-formula-v1` so they round-trip through flow JSON.

- **Where**: shared lib `packages/core/shared/src/lib/formula/` (`AP_FUNCTIONS` registry is the single source of truth; `formulaEvaluator.evaluate`, type checker). Editor is the TipTap `text-input-with-mentions`. Runtime hooks in the engine's `props-resolver.ts` pre-pass.
- **Gotchas**: no HTTP endpoints, no DB tables, no worker job — evaluation is synchronous in the engine. Runs on **every** edition, unconditionally (even if the editor flag is off, saved formulas still evaluate). Uses `expr-eval`; preprocess normalizes `;`→`,`, `and/or/not`, and rewrites `if()` to lazy ternary. Changing a function = bump `@activepieces/shared` minor; never hard-remove a function (mark `deprecated`).

### Workers

Node processes that poll the app over Socket.IO and execute flows. The worker *is* the sandbox — the full execution model (concurrency 1, replicas, Resolver, box lifecycle) lives on [Execution Runtime](https://craftspace.app/o/activepieces/pages/pg_xLVaOvA8hs9XVLj7kNZNE). Here, the piece-relevant behavior:

- **Version gate**: app and worker refuse to exchange jobs unless releases match exactly (fail-closed; auto-recovers once fleets converge).
- **Disconnect** returns in-flight jobs to the queue (`releaseConnectionJobs`) to avoid post-deploy "Job stalled" storms.
- **Worker groups** (`AP_WORKER_GROUP_ID` + `AP_PROJECT_WORKER`) route dedicated pools; per-project routing gated by `workerGroupsEnabled`.
- **Failed code-step** install/compile degrades to a throwing stub (user-attributed FAILED, not INTERNAL_ERROR + retries).

### AI Agents (gated by `agentsEnabled`)

A flow step type (`@activepieces/piece-agent`) running a ReAct-style LLM loop (up to `maxSteps`) that can call tools before producing a final answer. **No backend entity** — config lives in the flow version's step settings.

- **Tools** (`AgentTool` union): PIECE action, FLOW (child run), MCP server, KNOWLEDGE_BASE (semantic search on 768-dim embeddings). Config: `agentTools`, `structuredOutput`, `prompt`, `maxSteps`, `aiProviderModel`, optional web search.
- **Gotchas**: external MCP tools validated server-side via `POST /v1/projects/:projectId/agent-tools/mcp/validate` (initialize→initialized→tools/list handshake) through SSRF-filtered `apAxios`; errors collapse to one generic message. Lives under `agents/` (agent connecting *out*), distinct from `mcp/` (exposing AP *as* an MCP server). `AgentTimeline` renders step blocks in the builder.

## Pages

- **Pieces** — the catalog, metadata registry, versions
- **Piece Sets** — per-project include/exclude visibility, the undeletable Default set
- **Building Pieces** — authoring, testing and publishing a piece
