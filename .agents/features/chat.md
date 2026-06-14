# Chat Module

## Summary
A platform-level AI chat assistant that lets users interact with an LLM to manage their Activepieces projects through natural language. The chat connects to the platform's configured AI provider, streams responses via a custom WebSocket chunk reducer, and exposes Activepieces resources (flows, tables, connections, runs) as callable tools through the project's MCP server. Conversations are persisted per-user with support for message compaction, file attachments, multi-project context switching, two-phase (discovery/build) tool gating, and an action-preview gate for ad-hoc write actions. The full tool-call/tool-result history of every turn is persisted (all AI-SDK steps, not just the last), so the agent remembers what it already did within a conversation and does not re-run tools. Inputs are gathered conversationally through connection pickers and multi-question cards during discovery; once understood, the agent builds directly with no separate approval step (flow construction, testing, and publishing are not gated).

## Key Files
- `packages/server/api/src/app/ee/chat/chat.module.ts` — module registration with `chatEnabled` plan gate
- `packages/server/api/src/app/ee/chat/chat-controller.ts` — HTTP endpoints (conversations CRUD, messages, tool approvals)
- `packages/server/api/src/app/ee/chat/chat-eval-controller.ts` — admin eval/playground endpoints (sandbox-gated): prompt-source inspection and simulate-a-turn; requires `chatPlaygroundEnabled`
- `packages/server/worker/src/lib/execute/jobs/ee/chat/run-chat-turn.ts` — pure dependency-injected streaming-loop core shared by the production worker, the replay eval gate, and the live playground
- `packages/server/api/src/app/ee/chat/chat-service.ts` — core business logic (conversation management, message streaming)
- `packages/server/api/src/app/ee/chat/chat-conversation-entity.ts` — ChatConversation TypeORM entity
- `packages/server/api/src/app/ee/chat/chat-helpers.ts` — provider/tier resolution, project access, conversation fetch/lock
- `packages/server/api/src/app/ee/chat/chat-history-hygiene.ts` — collapses stale tool outputs in history to control context dilution
- `packages/shared/src/lib/ee/chat/tool-phases.ts` — two-phase (discovery/build) denylist-based tool gating; shared by API and worker
- `packages/server/api/src/app/ee/chat/chat-model-factory.ts` — creates AI SDK `LanguageModel` from provider config (OpenAI, Anthropic, Google, Azure, Bedrock, Cloudflare, Custom)
- `packages/server/api/src/app/ee/chat/chat-compaction.ts` — long-conversation context management via summarization
- `packages/server/api/src/app/ee/chat/chat-approval-gate.ts` — Redis pub/sub gate for tool execution approval (5-min timeout); uses atomic SET NX for first-decision-wins semantics; also stores per-conversation cancel signals with a 10-min TTL; manages server-side connection store (available/selected connections per conversation+piece) and pending gate persistence for refresh resilience
- `packages/server/api/src/app/ee/chat/chat-file-utils.ts` — file attachment processing (base64, MIME validation, 10MB limit)
- `packages/server/api/src/app/ee/chat/tools/chat-tools.ts` — cross-project tool execution (auth discovery, action execution with server-managed connections, resource listing); `ap_execute_action` auto-fills connectionExternalId and projectId from Redis connection store — the LLM never sees credential IDs
- `packages/shared/src/lib/ee/chat/tool-classification.ts` — consolidated tool classification predicates (approval-required, action preview risk) as single source of truth; imported by both API server and worker
- `packages/server/api/src/app/ee/chat/mcp/chat-mcp.ts` — connects to Activepieces MCP server for project-scoped tools with approval wrapping
- `packages/server/api/src/app/ee/chat/history/chat-history.ts` — reconstructs chat history from AI SDK `ModelMessage` format
- `packages/server/api/src/app/ee/chat/prompt/chat-prompt.ts` — builds system prompt from markdown templates in `src/assets/prompts/`
- `packages/server/api/src/app/ee/chat/chat-sync-job.ts` — fire-and-forget telemetry sync to console.activepieces.com (cloud-only), grouped by platform and authenticated with each platform's license key (from `platform_plan`) as a Bearer token; platforms without a license key are skipped; also exposes `chatAnalyticsBulkSync` for admin bulk sync; falls back to reconstructing messages from raw ModelMessage[] when uiMessages is null
- `packages/shared/src/lib/ee/chat/index.ts` — shared Zod schemas, types (ChatConversation, request DTOs, ChatHistoryMessage), typed tool outputs (`ChatToolOutputs`); includes `PersistedActionReceiptPartSchema` for persisting action receipts in conversation history; `PersistedToolCallPartSchema` includes optional `title` and `description` fields for UI chip label and conversational status text
- `packages/web/src/app/routes/chat-with-ai/index.tsx` — main chat page component
- `packages/web/src/app/routes/chat-with-ai/ai-chat-box.tsx` — chat interface with provider check, message streaming, Zustand store provider; manages suggestion prefill via counter-based key remount on empty-state suggestion clicks
- `packages/web/src/app/routes/chat-with-ai/conversation-list.tsx` — conversation history sidebar
- `packages/web/src/app/routes/chat-with-ai/components/` — sub-components (input, assistant message, user message, thinking details panel, approval forms, connection picker, multi-question card, action-preview-card, action-receipt-card); `chat-empty-state.tsx` renders a personalized greeting with the user's first name, horizontal flow cards with images, and a vertical text-suggestion list with lazy-loaded icons
- `packages/web/src/features/chat/lib/chat-api.ts` — API client for `/v1/chat/*` endpoints
- `packages/web/src/features/chat/lib/chat-store.ts` — Zustand store for interaction state (approvals, plan progress, display cards, thinking panel)
- `packages/web/src/features/chat/lib/chat-store-context.tsx` — React context provider and `useChatStoreContext` selector hook
- `packages/web/src/features/chat/lib/use-chat.ts` — `useAgentChat()` hook managing message state (persisted, optimistic, streaming); stale-check only reconciles when the server reports the conversation is no longer STREAMING
- `packages/web/src/features/chat/lib/chunk-reducer.ts` — pure streaming state machine that accumulates `UIMessageChunk` events into a `ChatUIMessage`
- `packages/web/src/features/chat/lib/use-streaming-reducer.ts` — WebSocket-driven streaming lifecycle hook; buffers chunks and throttles React re-renders
- `packages/web/src/features/chat/lib/chat-types.ts` — frontend type definitions, tool output parsing, display/hidden tool name sets, `CreditsWarning` type
- `packages/web/src/features/chat/lib/use-credits-state.ts` — `useCreditsState()` hook computing credits warning/exhaustion state from platform usage and AI provider config
- `packages/web/src/app/routes/chat-with-ai/components/credits-banner.tsx` — amber/red banner shown when AI credits reach warning threshold (>=70%) or are exhausted
- `packages/web/src/features/chat/lib/use-voice-input.ts` — `useVoiceInput()` hook for speech-to-text via the Web Speech API (`SpeechRecognition`)
- `packages/web/src/features/chat/lib/use-tts.ts` — `useTts()` hook for text-to-speech via the `SpeechSynthesis` API
- `packages/web/src/features/chat/components/voice-waveform.tsx` — animated waveform bars shown on the stop-recording button

## Edition Availability
- Community (CE): not available (module not registered)
- Enterprise (EE): available when `platform.plan.chatEnabled` is true; the eval/playground endpoints (`/v1/chat/eval/*`) additionally require `platform.plan.chatPlaygroundEnabled`
- Cloud: available when `platform.plan.chatEnabled` is true

## Domain Terms
- **ChatConversation** — a persisted conversation between a user and the AI assistant, scoped to a platform and user; optionally scoped to a project for tool access
- **Message compaction** — when a conversation exceeds a token threshold, older messages are summarized by the LLM and replaced with a summary to keep context within the model's window
- **Tool approval gate** — a Redis pub/sub mechanism that blocks on user input until the user responds in the UI; times out after 5 minutes. Used to wait on display-tool cards (connection picker, multi-question card, project picker) and the ad-hoc action-preview gate. Flow build/test/publish and MCP tools are NOT gated — they execute directly
- **Two-phase toolset gating** — the agent runs in a `discovery` or `build` phase (`tool-phases.ts`); a denylist hides build-only tools during discovery to shrink the tool surface. `ap_set_phase` flips the phase; the gate auto-widens if a build/manage tool fires so the agent can't get stuck
- **Local tools** — chat-specific tools not part of MCP: `ap_set_session_title`, `ap_select_project`, `ap_deselect_project`, `ap_execute_action`, `ap_list_across_projects`, `ap_explore_data`, `ap_load_guide`, `ap_set_phase`
- **Display tools** — tools that render interactive UI cards: `ap_show_connection_required`, `ap_show_connection_picker`, `ap_show_project_picker`, `ap_show_questions`, `ap_show_quick_replies`
- **MCP tools** — project-scoped tools loaded from the Activepieces MCP server when a project is selected; wrapped only with a per-call execution timeout (`withToolTimeouts`) — the chat no longer gates them behind approval
- **Tool call UX metadata** — optional `title` (2-4 word chip label) and `description` (first-person conversational sentence) stored on `PersistedToolCallPart`; description is sourced from the preceding `ap_update_thinking_status` text with `input.description` as fallback, rendered above the tool card chip
- **Server-managed connections** — connection externalIds are never exposed to the LLM; `ap_discover_action_auth` stores available connections in Redis (with `grantedScopes` and `requiredScopes` for scope-aware selection), `ap_show_connection_picker` stores the user's selection, and `ap_execute_action` auto-fills the connection from the store
- **Action preview gate** — write/destructive actions show a preview card (parameters, connection) before execution; classification uses a hybrid AI-driven (`needsConfirmation` flag) + server hard-floor (name pattern matching) approach; persisted as pending gate in Redis for refresh resilience
- **Action receipt** — server-rendered card showing action result (status, output, connection badge, timestamp); emitted as `ACTION_RECEIPT` event and persisted as `PersistedChatPartType.ACTION_RECEIPT` in conversation history; receipt cards visually split the thinking accordion so each action's thinking section appears immediately above its receipt card
- **Pending gate persistence** — when a display tool or action preview blocks on approval, gate metadata is stored in Redis so the frontend can re-show the card after page refresh; cleared automatically when the gate resolves
- **Stream reconnection** — when loading a STREAMING conversation (e.g. after refresh), the frontend extracts the last assistant message from history as the streaming message's initial content, calls `getPendingGate` to inject synthetic display-tool parts for pending gates, then calls `startStream`; a socket `connect` handler re-registers the chunk listener and resets the stale-check timer on reconnect; the periodic stale-check calls `GET /conversations/:id` and only reconciles when the server's status is no longer STREAMING, so long tool executions (>15s) are not incorrectly torn down
- **Run ID event filtering** — each agent run gets a unique `runId` (generated in the controller, included in job data, threaded through all websocket events); the frontend's event handler filters by `runId` to prevent stale FINISHED/ERROR events from old runs from killing new streams; combined with a generation counter that guards against stale async reconcile callbacks
- **AI provider** — a platform-configured LLM provider with an `enabledForChat` flag; the chat resolves the first enabled provider and its default model
- **Streaming cancel** — cancel keys are run-scoped (`chat-cancel:{conversationId}:{runId}`) so each worker only checks its own key; a 3-second periodic timer polls the Redis key so cancellation fires within 3 seconds regardless of step boundaries; partial messages (from completed steps via `onAbort` callback) are saved to preserve context for resume; when a new message arrives while STREAMING, the controller reads the active runId, cancels that specific run, and resets status to IDLE before queuing the new job
- **Stale recovery** — when `getConversationOrThrow` fetches a conversation stuck in STREAMING for more than 2 minutes, it automatically resets the status to IDLE before returning
- **Project context** — the currently selected project for a conversation; determines which MCP tools are available and scopes resource access
- **Chat tiers** — model configurations (fast/smart/premium) with different thinking budgets; displayed as Fast/Expert/Heavy in the UI with per-tier descriptions
- **Credits warning banner** — a dismissible amber banner shown when Activepieces AI credits usage reaches 70%; a non-dismissible red banner is shown when credits are fully exhausted

## Data Model

**ChatConversation**: id, platformId, userId, projectId (nullable), title (nullable), modelName (nullable), messages (JSONB array of `ModelMessage`), summary (text, nullable — compaction summary), summarizedUpToIndex (int, nullable — index up to which messages are summarized).
- Relations: platform (many-to-one), project (many-to-one, SET NULL on delete), user (many-to-one, CASCADE on delete)
- Index: `idx_chat_conversation_platform_user_created_id` on (platformId, userId, created, id)

## Key Service Methods
- `createConversation()` — creates a new conversation for a user on a platform
- `listConversations()` — cursor-paginated list of user's conversations, ordered by creation date descending; excludes messages, uiMessages, and summary columns for performance
- `getConversationOrThrow()` — fetches a conversation, enforcing ownership (platformId + userId); auto-recovers stale STREAMING conversations to IDLE after a 2-minute timeout
- `updateConversation()` — updates title and/or modelName
- `deleteConversation()` — deletes a conversation after ownership check; blocked while status is STREAMING
- `getMessages()` — reconstructs `ChatHistoryMessage[]` from stored `ModelMessage[]`
- `sendMessage()` — the main streaming flow: resolves provider, connects MCP, builds prompt, runs `streamText()` with `stopWhen: isLoopFinished()` (no hard step cap), `prepareStep` (narrows the active toolset to the current discovery/build phase), `experimental_repairToolCall` (auto-fixes malformed JSON), and `experimental_onToolCallFinish` (per-tool logging); retries event delivery with exponential backoff; tools have a 5-minute per-call timeout with AbortSignal propagation; persists assistant response on completion

## Local Tools
- `ap_set_session_title` — auto-names the conversation after the first exchange
- `ap_select_project` — switches project context (scopes MCP tools to that project)
- `ap_execute_action` — executes a single piece action ad-hoc (e.g. "check my inbox"); connections are managed server-side (the LLM never sees externalIds); write/destructive actions trigger an action preview gate before execution; emits `ACTION_RECEIPT` events after completion
- `ap_list_across_projects` — lists flows, tables, runs, or connections across all user-accessible projects
- `ap_deselect_project` — clears the selected project context
- `ap_explore_data` — read-only exploration of the user's data (sheets, channels, columns) to build understanding during discovery; never configures the automation
- `ap_load_guide` — loads an on-demand prompt guide (e.g. `build_flow`) so guidance is only in context when needed
- `ap_set_phase` — flips the agent between the `discovery` and `build` tool phases

## Display Tools
- `ap_show_connection_required` — prompts the user to connect a service
- `ap_show_connection_picker` — lets the user choose between multiple connections; no longer receives connections array from LLM (server-managed); returns only `{ selected: true, label }` to LLM, stripping externalIds
- `ap_show_project_picker` — lets the user select a project
- `ap_show_questions` — renders an interactive multi-question form
- `ap_show_quick_replies` — shows suggested response buttons

## Endpoints
- `POST /v1/chat/conversations` — create conversation
- `GET /v1/chat/conversations` — list conversations (cursor, limit)
- `GET /v1/chat/conversations/:id` — get conversation
- `POST /v1/chat/conversations/:id` — update conversation (title, modelName)
- `DELETE /v1/chat/conversations/:id` — delete conversation
- `GET /v1/chat/conversations/:id/messages` — get conversation messages
- `POST /v1/chat/conversations/:id/messages` — send message; if the conversation is STREAMING the old run is cancelled; response body is `{ conversationId, runId }` — clients use runId to filter stale events
- `POST /v1/chat/tool-approvals/:gateId` — approve or deny a tool execution
- `POST /v1/chat/conversations/:id/cancel` — cancel an in-progress streaming response
- `GET /v1/chat/conversations/:id/connections?pieceName=` — get available connections for connection picker; falls back to `findConnectionsForPiece` when the Redis cache is empty and stores the result for future calls
- `GET /v1/chat/conversations/:id/pending-gate` — get pending approval gate for refresh resilience (returns gate info so the frontend can re-show display tool cards)
- `GET /v1/chat/eval/prompt-sources` — returns the raw prompt template sources (core + project-context + on-demand guides); requires platformAdmin + `chatPlaygroundEnabled`
- `POST /v1/chat/eval/simulate` — runs a full chat turn with an optional prompt override against the sandbox project, polls until settled, and returns the transcript synchronously (`status` is `IDLE`/`ERROR`/`TIMEOUT`); requires platformAdmin + `chatPlaygroundEnabled`

- `POST /v1/admin/chat/sync-all` — bulk historical sync of all conversations to console analytics (admin API key required)

All chat endpoints require `PrincipalType.USER` authentication at the platform level. The admin sync endpoint uses `api-key` header auth.

## Message Flow
1. User sends message via `POST /conversations/:id/messages`
1a. If the conversation is STREAMING, the controller reads the active runId, cancels that run, and resets status to IDLE
1b. If the platform's chat provider is ACTIVEPIECES and `usageRemaining <= 0`, the endpoint returns a 402 `AI_CREDIT_LIMIT_EXCEEDED` error before queuing the job; the frontend surfaces a non-dismissible error banner
1c. Controller generates a `runId`, includes it in the job data, and returns it to the frontend
2. Service resolves AI provider, connects MCP client, builds system prompt with project list
3. If conversation is long, compaction summarizes older messages
4. `streamText()` streams the LLM response with local tools + display tools + MCP tools available
5. Display-tool cards (connection picker, questions) and ad-hoc write actions (`ap_execute_action` previews) pause and emit a gate request to the UI via the stream; flow build/test/publish run without gating
6. User responds via `POST /tool-approvals/:gateId`, unblocking the gate via Redis pub/sub
7. On stream completion, assistant messages are appended to the stored conversation
8. On cloud, `chatAnalyticsTelemetry` pushes the updated conversation to `console.activepieces.com` for monitoring (fire-and-forget, authenticated with the platform's license key as a Bearer token and skipped when the platform has no license key); messages are sourced from uiMessages when available, falling back to reconstruction from raw ModelMessage[] for older conversations
