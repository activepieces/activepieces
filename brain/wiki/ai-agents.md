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
- Shared types in `core/shared/.../automation/agents/` — `AgentToolType`, `AgentResult` (`prompt`, `steps[]`, `status`, optional `structuredOutput`), `AgentTaskStatus`, tool Zod schemas in `tools.ts`.

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
