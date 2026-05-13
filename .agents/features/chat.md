# Chat Module

## Summary
A platform-level AI chat assistant that lets users interact with an LLM to manage their Activepieces projects through natural language. The chat connects to the platform's configured AI provider, streams responses via the Vercel AI SDK, and exposes Activepieces resources (flows, tables, connections, runs) as callable tools through the project's MCP server. Conversations are persisted per-user with support for message compaction, file attachments, multi-project context switching, and a tool approval gate for destructive operations.

## Key Files
- `packages/server/api/src/app/ee/chat/chat.module.ts` — module registration with `chatEnabled` plan gate
- `packages/server/api/src/app/ee/chat/chat-controller.ts` — HTTP endpoints (conversations CRUD, messages, tool approvals)
- `packages/server/api/src/app/ee/chat/chat-service.ts` — core business logic (conversation management, message streaming)
- `packages/server/api/src/app/ee/chat/chat-conversation-entity.ts` — ChatConversation TypeORM entity
- `packages/server/api/src/app/ee/chat/chat-model-factory.ts` — creates AI SDK `LanguageModel` from provider config (OpenAI, Anthropic, Google, Azure, Bedrock, Cloudflare, Custom)
- `packages/server/api/src/app/ee/chat/chat-compaction.ts` — long-conversation context management via summarization
- `packages/server/api/src/app/ee/chat/chat-approval-gate.ts` — Redis pub/sub gate for tool execution approval (5-min timeout)
- `packages/server/api/src/app/ee/chat/chat-file-utils.ts` — file attachment processing (base64, MIME validation, 10MB limit)
- `packages/server/api/src/app/ee/chat/tools/chat-tools.ts` — local LLM tools (title, project selection, action execution, cross-project listing) + subagent tool wrappers (builder, researcher)
- `packages/server/api/src/app/ee/chat/tools/chat-tool-categories.ts` — consolidated tool classification predicates (build, research, mutation, approval-required) as single source of truth
- `packages/server/api/src/app/ee/chat/agents/builder-agent.ts` — builder subagent: ToolLoopAgent build loop, structured evaluation, and iterative fix loop
- `packages/server/api/src/app/ee/chat/agents/researcher-agent.ts` — researcher subagent: read-only ToolLoopAgent for piece discovery, failure investigation, and cross-flow analysis
- `packages/server/api/src/app/ee/chat/chat-prepare-step.ts` — phase detection and per-step thinking-budget / tool-filter overrides via AI SDK `prepareStep`
- `packages/server/api/src/app/ee/chat/mcp/chat-mcp.ts` — connects to Activepieces MCP server for project-scoped tools with approval wrapping
- `packages/server/api/src/app/ee/chat/history/chat-history.ts` — reconstructs chat history from AI SDK `ModelMessage` format
- `packages/server/api/src/app/ee/chat/prompt/chat-prompt.ts` — builds system prompt from markdown templates in `src/assets/prompts/`
- `packages/shared/src/lib/ee/chat/index.ts` — shared Zod schemas and types (ChatConversation, request DTOs, ChatHistoryMessage)
- `packages/web/src/app/routes/chat-with-ai/index.tsx` — main chat page component
- `packages/web/src/app/routes/chat-with-ai/ai-chat-box.tsx` — chat interface with provider check, message streaming, tool approvals
- `packages/web/src/app/routes/chat-with-ai/conversation-list.tsx` — conversation history sidebar
- `packages/web/src/app/routes/chat-with-ai/components/` — sub-components (input, messages, model selector, project selector, tool approval form)
- `packages/web/src/features/chat/lib/chat-api.ts` — API client for `/v1/chat/*` endpoints
- `packages/web/src/features/chat/lib/use-chat.ts` — `useAgentChat()` hook managing conversation state
- `packages/web/src/features/chat/lib/use-tool-approval.ts` — hook for tool approval requests

## Edition Availability
- Community (CE): not available (module not registered)
- Enterprise (EE): available when `platform.plan.chatEnabled` is true
- Cloud: available when `platform.plan.chatEnabled` is true

## Domain Terms
- **ChatConversation** — a persisted conversation between a user and the AI assistant, scoped to a platform and user; optionally scoped to a project for tool access
- **Message compaction** — when a conversation exceeds a token threshold, older messages are summarized by the LLM and replaced with a summary to keep context within the model's window
- **Tool approval gate** — a Redis pub/sub mechanism that pauses destructive tool executions (delete, test, publish) until the user explicitly approves or denies in the UI; times out after 5 minutes
- **Local tools** — chat-specific tools not part of MCP: `ap_set_session_title`, `ap_select_project`, `ap_run_one_time_action`, `ap_list_across_projects`
- **MCP tools** — project-scoped tools loaded from the Activepieces MCP server when a project is selected; destructive ones are wrapped with the approval gate
- **AI provider** — a platform-configured LLM provider with an `enabledForChat` flag; the chat resolves the first enabled provider and its default model
- **Project context** — the currently selected project for a conversation; determines which MCP tools are available and scopes resource access
- **Builder agent** — an isolated `ToolLoopAgent` (max 30 steps) owning the full flow-construction pipeline with step-by-step validation, testing, evaluation, and iterative fix
- **Researcher agent** — a read-only `ToolLoopAgent` (max 15 steps) for investigation tasks (piece discovery, failure debugging, cross-flow analysis)
- **Phase-aware execution** — the main chat agent detects conversation phase (research/planning/building/finalizing) and dynamically adjusts available tools and thinking budget
- **Build evaluation** — LLM evaluation step comparing built flow against spec; verdict: `pass`, `fixable`, or `needs_user_input`

## Data Model

**ChatConversation**: id, platformId, userId, projectId (nullable), title (nullable), modelName (nullable), messages (JSONB array of `ModelMessage`), summary (text, nullable — compaction summary), summarizedUpToIndex (int, nullable — index up to which messages are summarized).
- Relations: platform (many-to-one), project (many-to-one, SET NULL on delete), user (many-to-one, CASCADE on delete)
- Index: `idx_chat_conversation_platform_user_created_id` on (platformId, userId, created, id)

## Key Service Methods
- `createConversation()` — creates a new conversation for a user on a platform
- `listConversations()` — cursor-paginated list of user's conversations, ordered by creation date descending
- `getConversationOrThrow()` — fetches a conversation, enforcing ownership (platformId + userId)
- `updateConversation()` — updates title and/or modelName
- `deleteConversation()` — deletes a conversation after ownership check
- `getMessages()` — reconstructs `ChatHistoryMessage[]` from stored `ModelMessage[]`
- `setProjectContext()` — sets or clears the project scope, verifying user has access
- `sendMessage()` — the main streaming flow: resolves provider, connects MCP, builds prompt, runs `streamText()` with phase-aware `prepareStep` and two subagent tools (`ap_build_automation`, `ap_research`); persists assistant response on completion

## Local Tools
- `ap_set_session_title` — auto-names the conversation after the first exchange
- `ap_select_project` — switches project context (scopes MCP tools to that project)
- `ap_run_one_time_action` — executes a single piece action ad-hoc (e.g. "check my inbox"); auto-discovers connections across projects
- `ap_list_across_projects` — lists flows, tables, runs, or connections across all user-accessible projects
- `ap_build_automation` — delegates flow building to the builder subagent; emits real-time `data-build-progress` SSE events
- `ap_research` — delegates investigation tasks to the researcher subagent

## Endpoints
- `POST /v1/chat/conversations` — create conversation
- `GET /v1/chat/conversations` — list conversations (cursor, limit)
- `GET /v1/chat/conversations/:id` — get conversation
- `POST /v1/chat/conversations/:id` — update conversation (title, modelName)
- `DELETE /v1/chat/conversations/:id` — delete conversation
- `GET /v1/chat/conversations/:id/messages` — get conversation messages
- `POST /v1/chat/conversations/:id/messages` — send message (streaming response)
- `POST /v1/chat/tool-approvals/:gateId` — approve or deny a tool execution
- `POST /v1/chat/conversations/:id/project-context` — set project context

All endpoints require `PrincipalType.USER` authentication at the platform level.

## Message Flow
1. User sends message via `POST /conversations/:id/messages`
2. Service resolves AI provider, connects MCP client, builds system prompt with project list
3. If conversation is long, compaction summarizes older messages
4. `streamText()` streams the LLM response with local tools + MCP tools available
5. Destructive MCP tool calls pause and emit an approval request to the UI via the stream
6. User approves/denies via `POST /tool-approvals/:gateId`, unblocking the gate via Redis pub/sub
7. On stream completion, assistant messages are appended to the stored conversation
