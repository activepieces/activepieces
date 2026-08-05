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
