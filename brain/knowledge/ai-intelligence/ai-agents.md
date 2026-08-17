---
icon: 🤖
---

# AI Agents

A flow step type (backed by `@activepieces/piece-agent`) that runs an LLM-driven autonomous loop. Given a prompt, tools, an AI provider/model, and optional structured-output fields, it runs a ReAct-style loop (up to `maxSteps`) where the model can call any configured tool before producing a final answer.

### How it works

- No backend entity of its own — the whole configuration lives inside the flow version's step settings. The step is a `PIECE` action on `@activepieces/piece-agent`; `settings.input` holds `agentTools`, `structuredOutput`, `prompt`, `maxSteps`, `aiProviderModel` (`{ provider, model }`), and optional `webSearch`.
- Configured entirely in the Flow Builder (`web/src/app/builder/step-settings/agent-settings/`); a test panel runs a single agent step. `AgentTimeline` renders `AgentStepBlock[]` from the output as markdown blocks + expandable tool-call cards.

### Tool types (AgentTool discriminated union)

- **PIECE** — a specific piece action (`pieceName`/`pieceVersion`/`actionName`); can carry `predefinedInput` locking certain fields.
- **FLOW** — calls another flow by `externalFlowId`, executed as a child run.
- **MCP** — connects to an external MCP server (SSE / StreamableHTTP / SimpleHTTP; None/Bearer/ApiKey/Headers auth).
- **KNOWLEDGE_BASE** — semantic search over a KB file/table (cosine similarity, 768-dim embeddings).
- **PredefinedInputsStructure** — per-field `AGENT_DECIDE` / `CHOOSE_YOURSELF` / `LEAVE_EMPTY` baked into the tool so the agent knows which inputs it controls.

### Gotchas

- Gated by `platform.plan.agentsEnabled`; when off, the step type is hidden from the piece selector. Off by default on Community, on for Cloud plans that include it.
- External MCP tools are validated server-side via `POST /v1/projects/:projectId/agent-tools/mcp/validate` — a JSON-RPC `initialize` → `notifications/initialized` → `tools/list` handshake returning tool names. Outbound call routes through `apAxios` with `ssrf-agents.ts` rejecting private/loopback/link-local/meta IPs (allow ranges via `AP_SSRF_ALLOW_LIST`, CIDR). All error paths collapse to one generic message to avoid leaking reachability.
- That validator lives under `agents/` (validating a server the agent connects *to*), deliberately separate from the `mcp/` module which exposes Activepieces itself *as* an MCP server (opposite direction).
- Shared types live in **two** packages on purpose: `core/piece-types/src/lib/agents.ts` (`zod/mini`, for pieces) and `core/execution/src/lib/agents/` (plain `zod`, for server/web). `AgentResult` is `prompt`, `steps[]`, `status`, optional `structuredOutput`.
- **The enums and pure functions have exactly one home: `core/piece-types/src/lib/agents.ts`.** Do not re-declare `AgentToolType`, `McpAuthType`, `buildAuthHeaders`, `TASK_COMPLETION_TOOL_NAME`, or `mcpToolNameUtils` in `core-execution` — re-export them. They used to be duplicated byte-for-byte across both packages, which was silently load-bearing: if `createToolName` drifted, the tool names `migrate-v16` persisted would stop matching runtime names and every piece/flow/MCP call on a migrated flow would degrade to `ToolCallType.UNKNOWN`. `mcp-tool-name-util.test.ts` asserts both entry points resolve to the *same object*, so a re-fork fails the test rather than shipping.
- The four `core/execution/src/lib/agents/` files are **not** uniform. `mcp-tool-name-util.ts` and `mcp.ts` are pure re-export shims (1 and 6 lines). `index.ts` and `tools.ts` re-export the canonical enums and functions but still **own** the execution-side plain-`zod` schema definitions — `tools.ts` declares the `AgentTool` union and the `McpAuth*` schemas, `index.ts` declares `AgentOutputField`, `MarkdownContentBlock`, `ToolCallContentBlock` and `AgentStepBlock`. Adding a field to one of those schemas means editing it there *and* in the `zod/mini` twin in `agents.ts`.
- **A flow-step run must not reuse chat's resolution logic.** Four separate production failures came from this one assumption while moving the step server-side, each looking like its own bug. `resolveChatProvider` made a step need Chat's provider configured before it would run at all, so an instance that never uses Chat could not run an agent step — and it bit twice, because `resolveFastModel` reached the same helper underneath, so every *configured piece tool* failed with a bare `ENTITY_NOT_FOUND` long after the main model had been fixed. Grep for the transitive callers, not just the direct ones. `resolveModelIdForProvider` treats its argument as a *tier* id and falls back to the tier default when it is not in the curated chat list — a step configured for `claude-sonnet-4.5` silently ran `4.6`, because a step names a concrete model while chat names a tier. And the chat tool set reaches an unattended run, where a tool that asks the user a question is worse than useless: the agent opened a connection picker, read the empty answer as a refusal, and stopped. When a value crosses between the two surfaces, check what it *means* on each side, not just that the types line up.
- **A worker RPC failure reaches the worker as `error.message` and nothing else.** The envelope in `core/execution/src/lib/engine/rpc.ts` drops `ActivepiecesError.params` and the stack, so three unrelated causes (conversation gone, no chat-enabled provider, pinned provider has no row) all arrive as the same bare `ENTITY_NOT_FOUND` — unreadable in the failed-job list. `createRpcServer` logs the intact error on the app side; read *that* log, not the worker's.
- **Whatever enqueues an agent run must pre-check the same thing the worker resolves.** The chat route asked "is any provider enabled for chat" while the worker looked up the run's *pinned* provider, and the flow-step route checked nothing at all — so a run enqueued fine and could only fail. Both now call `agentHelpers.assertRunProviderConfigured`, which mirrors the worker's lookup. A pre-check that answers a *different* question than the worker is worse than none: it makes the failure look impossible.
- **Everything the agent job does before its try/catch has no recovery.** `getAgentConfig` used to run outside it, so a config failure sent no error to the chat client and never called `releaseFlowStep` — the flow run sat PAUSED until `AP_PAUSED_FLOW_TIMEOUT_DAYS`. Anything added above that block needs its own failure path, or a paused run leaks.
- **Build the unattended tool set as an allow-list.** Removing chat tools by name failed three times running — display tools, then build-plan and phase tools, then `ap_discover_action_auth` and `ap_load_guide`, which live with the local tools and so survived a filter written by tool group. Grouping tracks where a tool was constructed, not whether it assumes someone is reading. A flow step gets exactly what it is listed: its configured piece actions, the public-web readers, and the structured-output tool. Anything added to chat later stays out by default.
- A separate zod-free `agent-primitives.ts` holding those values was tried and **folded back** — don't re-create it. It bought no isolation: `core-execution` imports the `@activepieces/core-piece-types` **barrel**, which re-exports `agents.ts`, so `zod/mini` comes along whatever the values live in.
- Only the zod *schemas* stay duplicated — the `zod` vs `zod/mini` split is a real bundle-size decision, and a schema drift breaks loudly where a function drift did not.
- **In `agents.ts` the enums must stay above the schemas that use them.** A TS enum compiles to a hoisted `var` plus a deferred IIFE, so a schema evaluating `z.literal(AgentToolType.PIECE)` at module load before the enum block has run reads `undefined`. `tsc` catches it (`TS2450: Enum used before its declaration`), but only if you build — it is easy to introduce while reordering the file to satisfy the "exported types and constants at the end" convention.

### Key files

Entry point: `runAgent`, the createAction in the `ai` piece registered in `packages/pieces/community/ai/src/index.ts`.

- `packages/pieces/community/ai/src/lib/actions/agents/` — the agent loop itself: `runAgent`, tool construction, output builder
- `packages/core/piece-types/src/lib/agents.ts` — `AgentToolType`, `AgentPieceProps`, `AgentStepBlock`, tool zod schemas; re-exported through `pieces-framework`
- `packages/core/execution/src/lib/agents/` — execution-side agent types, tool schemas, MCP tool-name helpers
- `packages/web/src/features/agents/` — all agent UI: tool dialogs and stores, `AgentTimeline`, `AIModelSelector`, `SUPPORTED_AI_PROVIDERS`, structured output
- `packages/web/src/app/builder/step-settings/agent-settings/` — builder panel for configuring an agent step
- `packages/web/src/app/builder/test-step/agent-test-step/` — test panel for running one agent step
- `packages/server/api/src/app/agents/` — `agentsModule`, the `/agent-tools` route, and the external MCP tool validator
- `packages/server/api/src/app/flows/flow-version/migrations/` — the agent step migrations (v7, v8, v14, v15, v16)
- `packages/core/utils/src/lib/ssrf-ip-classifier.ts` and `packages/server/utils/src/safe-http.ts` — the SSRF guard on outbound calls

Paths verified 2026-07-17. An earlier version pointed at `packages/core/shared/src/lib/automation/agents/`; those types now live in `packages/core/piece-types/src/lib/agents.ts` and `packages/core/execution/src/lib/agents/`.

### Knowledge base gotchas

- **A knowledge base uploaded through the UI is not searchable.** Nothing in the upload path generates chunk embeddings; `knowledge-base.controller.ts` only *accepts* an embedding on a chunk. Chunks land with `embedding IS NULL`, and search filters those out, so the result is an empty answer rather than an error.
- **`knowledge_base_chunk` is created by a migration that records itself as run even when pgvector is absent.** A database that gains pgvector later never gets the table, because the migration is already marked complete. Deleting its row from `migrations` replays it safely, since the DDL is `CREATE TABLE IF NOT EXISTS`.
- **Embeddings are stored at a fixed 768 dimensions, and most models do not return that.** `text-embedding-3-small` answers 1536, and the `dimensions` provider option is namespaced under `openai`, so the OpenRouter and managed paths never see it. `agentAiUtils.toStorageEmbedding` truncates and re-normalises instead, which is what the option does server-side and works whatever the provider returns. This only holds for Matryoshka-trained models — adding a model that is not one will truncate badly and silently.
