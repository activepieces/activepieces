# AI Agents

## Summary
Agents is a flow step type (backed by `@activepieces/piece-agent`) that executes an LLM-driven autonomous loop. The agent is given a prompt, a set of tools, an AI provider/model, and optional structured-output fields. It runs a ReAct-style loop (up to `maxSteps`) where the model can call any configured tool before producing a final answer. Tools can be piece actions, other flows, MCP servers, or knowledge-base files. The feature is entirely configured inside the Flow Builder as a special step and does not have its own backend entity — the agent configuration lives inside the flow version's step settings.

## Key Files

### Shared Types
- `packages/shared/src/lib/automation/agents/index.ts` — enums (`AgentToolType`, `AgentTaskStatus`, `ContentBlockType`, `ToolCallType`, `AgentOutputFieldType`), types (`AgentProviderModel`, `AgentResult`, `AgentStepBlock`, `AgentOutputField`), and `AgentPieceProps` property name enum
- `packages/shared/src/lib/automation/agents/tools.ts` — all tool Zod schemas: `AgentPieceTool`, `AgentFlowTool`, `AgentMcpTool`, `AgentKnowledgeBaseTool`, `AgentTool` discriminated union; `McpAuthConfig`, `PredefinedInputsStructure`

### Frontend
- `packages/web/src/features/agents/index.ts` — barrel export
- `packages/web/src/features/agents/hooks/agent-hooks.ts` — `agentQueries.useFlowsForAgent()`, `agentMutations.useValidateMcpTool()`
- `packages/web/src/features/agents/agent-tools/` — tool management UI (add dropdown, per-tool dialogs, stores)
- `packages/web/src/features/agents/agent-tools/stores/` — Zustand stores for piece-tools dialog (`pieces-tools.ts`) and knowledge-base tools (`knowledge-base-tools.ts`)
- `packages/web/src/features/agents/agent-tools/piece-tool-dialog/` — multi-page dialog: piece list → action list → predefined inputs form → connection picker
- `packages/web/src/features/agents/agent-tools/flow-tool-dialog/` — dialog to attach another flow as a tool
- `packages/web/src/features/agents/agent-tools/mcp-tool-dialog/` — MCP server URL + auth config dialog; calls `mcpToolApi.validateAgentMcpTool` to verify connectivity
- `packages/web/src/features/agents/agent-tools/knowledge-base-dialog/` — dialog to attach a knowledge-base file
- `packages/web/src/features/agents/agent-timeline/` — `AgentTimeline` component that renders step-by-step execution blocks (markdown + tool calls) from `AgentResult.steps`
- `packages/web/src/features/agents/ai-model/` — `AIModelSelector` component; `PROVIDER_EMBEDDING_MODELS` constant
- `packages/web/src/features/agents/ai-providers.ts` — `SUPPORTED_AI_PROVIDERS` list with metadata per provider
- `packages/web/src/features/agents/structured-output/` — `AgentStructuredOutput` component for defining output field schema
- `packages/web/src/app/builder/step-settings/agent-settings/index.tsx` — builder panel for configuring an agent step
- `packages/web/src/app/builder/test-step/agent-test-step/index.tsx` — test panel for running a single agent step and viewing results

## Edition Availability
Gated by `platform.plan.agentsEnabled`. When disabled, the agent step type is hidden from the piece selector. All editions can run agents if the flag is enabled; by default it is off on Community, on on Cloud plans that include it.

## Domain Terms
- **AgentTool** — a discriminated union of the four tool types a user can attach to an agent step
- **AgentToolType** — `PIECE`, `FLOW`, `MCP`, `KNOWLEDGE_BASE`
- **AgentPieceTool** — references a specific piece action by `pieceName`, `pieceVersion`, `actionName`; can carry `predefinedInput` locking certain fields
- **AgentFlowTool** — calls another flow by `externalFlowId`; the flow is executed as a child run
- **AgentMcpTool** — connects to an MCP (Model Context Protocol) server; supports SSE, StreamableHTTP, and SimpleHTTP protocols with None/Bearer/ApiKey/Headers auth
- **AgentKnowledgeBaseTool** — performs semantic search over a knowledge-base file or table; uses cosine similarity on 768-dim embeddings
- **PredefinedInputsStructure** — per-field config (`AGENT_DECIDE`, `CHOOSE_YOURSELF`, `LEAVE_EMPTY`) baked into the tool so the agent knows which inputs it controls
- **AgentResult** — runtime output containing `prompt`, `steps[]`, `status`, and optional `structuredOutput`
- **AgentStepBlock** — either `MarkdownContentBlock` or `ToolCallContentBlock` describing one turn in the agent loop
- **ToolCallStatus** — `IN_PROGRESS` (streaming) or `COMPLETED`
- **AgentTaskStatus** — `COMPLETED`, `FAILED`, `IN_PROGRESS`

## Agent Step Configuration (stored in flow version)
The agent step is a `PIECE` action on `@activepieces/piece-agent`. Its `settings.input` contains:
- `agentTools` — `AgentTool[]`
- `structuredOutput` — `AgentOutputField[]`
- `prompt` — string (may include `{{variables}}`)
- `maxSteps` — number
- `aiProviderModel` — `AgentProviderModel` (`{ provider, model }`)
- `webSearch` / `webSearchOptions` — optional web search tool configuration

## Tool Validation
MCP tools are validated in the browser before saving via `mcpToolApi.validateAgentMcpTool` (see `packages/web/src/features/agents/agent-tools/mcp-tool-dialog/validate-mcp-tool.ts`), which performs the JSON-RPC `initialize` + `tools/list` handshake directly against the MCP server and returns the list of tool names or an error. Moving this out of the server eliminates the SSRF surface from user-supplied MCP URLs.

## Timeline Rendering
`AgentTimeline` receives `AgentStepBlock[]` from the step output and renders:
- Markdown blocks as formatted text
- Tool call blocks as expandable cards showing tool name, type-specific metadata (piece icon, flow name, MCP URL, KB name), input, output, and status badge
