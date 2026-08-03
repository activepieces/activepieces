---
icon: 💬
---

# Chat

A platform-level AI chat assistant that manages Activepieces projects via natural language. Streams LLM responses over WebSocket and exposes project resources (flows, tables, connections, runs) as callable tools through the project's MCP server. Conversations persist per-user with compaction, attachments, multi-project context, and two-phase tool gating. EE/Cloud only (not registered in CE).

### Execution model (read first)
The chat LLM loop runs in the **worker**, not the API. Send path: `chat-controller.ts` (`POST /conversations/:id/messages`) enqueues a `WorkerJobType.EXECUTE_CHAT_AGENT` job → worker `execute-chat-agent.ts` calls `getChatConfig` RPC, assembles tools, runs `run-chat-turn.ts` (shared `streamText()` DI loop) → chunks stream back via `sendChatEvent` RPC → websocket `CHAT_MESSAGE_CHUNK` (filtered by `runId`) → frontend reducer. `chat-service.ts` only does conversation CRUD + persistence.

### Entities & services
- **ChatConversation** — per-user, per-platform, optionally per-project; `status` STREAMING/IDLE/ERROR, `activeRunId`, `messages` (ModelMessage[] JSONB), `uiMessages`, `summary`/`summarizedUpToIndex` for compaction.
- **ChatRolloutUser** (`chat_rollout_user`) — cloud rollout cohort; `chattedAt` drives the cap.
- Tool logic in `ee/chat/`; shared tool phase/classification in `core/shared/.../ee/chat/`.

### How it works
- **Tools**: local (`ap_execute_action`, `ap_select_project`, `ap_load_guide`, `ap_fetch_url`, `ap_set_phase`…), display cards (`ap_show_connection_picker`, `ap_show_questions`, `ap_show_quick_replies`…), and project-scoped MCP tools.
- **Two-phase gating** — `discovery` vs `build`; a denylist hides build-only tools during discovery to shrink the surface. `ap_set_phase` flips it; auto-widens if a build tool fires.
- **Gates** (Redis pub/sub, 5-min timeout): display-tool cards, ad-hoc action preview, and the test-flow write gate. Flow build + publish are NOT gated.
- Web access: provider-native search rides the configured LLM credential (Anthropic `web_search_20250305`, Google grounding, OpenRouter `web` plugin); `ap_fetch_url` works everywhere.

### Turn liveness — three independent timers (get this right)
A turn is kept alive / reclaimed by three separate mechanisms in `execute-chat-agent.ts`; confusing them causes "chat randomly stops" bugs:
- **Heartbeat** (`HEARTBEAT_INTERVAL_MS` 15s): a `setInterval` that bumps `conversation.updated` (via `heartbeatChatConversation` RPC) + sends an empty keepalive chunk, so a live-but-slow turn is never reclaimed as stale.
- **DB stale-recovery** (`STREAMING_STALENESS_TIMEOUT_MS` 90s, `chat-helpers.ts`): on-read (`getConversationOrThrow`) + a per-minute sweep flip any STREAMING conversation whose `updated` is >90s old back to IDLE. The heartbeat is what holds this off.
- **Stream idle watchdog** (`STREAM_IDLE_TIMEOUT_MS` 90s, in `streamChunksToClient`): aborts the turn if the drain-stream reader is silent 90s. It must be SUSPENDED while legitimate silent work is in flight — pending tool calls AND in-flight reasoning (`reasoning-start`→`reasoning-end`). **Reasoning-awareness was missing and caused the bug where long "thinking" on the Expert tier randomly aborted a healthy turn** (a >90s gap between reasoning deltas looked like a wedge). Backstop for a genuine mid-reasoning wedge is `MAX_TURN_WALL_CLOCK_MS` (20 min).

### Gotchas
- **Server-managed connections**: the LLM never sees connection externalIds; `ap_execute_action` auto-fills them from a Redis store.
- **Prompt-injection taint**: a per-turn `taintState` flips to `tainted` after consuming untrusted content (`ap_fetch_url`/`ap_scrape_url`/`ap_web_search`/`ap_explore_data`), which then forces the action-preview gate on any non-read-only action, ignoring the model's `needsConfirmation`.
- **Write-check gate**: before a live `ap_test_flow`, `__flow_write_check` RPC flags write/destructive PIECE steps; read-only flows run ungated; gate fails open on RPC error.
- **Cloud rollout cap**: opens to non-embed users without `chatEnabled` until 200 distinct users have sent a message (`CLOUD_CHAT_ROLLOUT_CAP`); grandfathered after close. Embedded sessions never see chat.
- **Flow correctness is 100% prompt/guide-driven — nothing in code enforces it.** The "#1 silent bug" ("Class A"): the agent frames a *recurring* automation as a *one-time task* and omits any anti-reprocessing step, so run N+1 redoes run N's work (re-pays, re-sends). It's a design-time reasoning gap, not a testing gap — `ap_test_flow` runs ONCE, so a single test looks perfect; the bug only shows on the 2nd run. Fix lives in the prompt (`chat-system-prompt.md` `<decision_framework>` + `build_flow.md` "Recurring flows must not reprocess") + capability eval fixtures with a `recurring_avoids_reprocessing` judge dimension. The platform already has every primitive (Tables New-Record webhook, polling `DedupeStrategy`, `_dedupe_key`, Store, update/delete-record); the agent just wasn't reaching for them. Watch the `build_flow.md` "don't over-build" bias — it once actively discouraged the fix.
- **The context budget ignores tool schemas and reserved `max_tokens`.** Anthropic/OpenRouter count both against the 200k window; `chat-compaction.ts` budgets neither. It trims history to `COMPACTION_THRESHOLD (0.7) × 200_000 = 140_000` and its fit check looks only at message chars, while `run-chat-turn.ts:73` sets `maxOutputTokens: tier.thinkingBudget + 32_000` → 52k reserved on premium, plus ~12k of tool schemas (62 tools, 41 via MCP). 140k + 12k + 52k = 204k, so a conversation that compacts to just under the threshold still 400s with "maximum context length is 200000 tokens" — and it gets retried ~6× (`streamText maxRetries: 3` × `MAX_STREAM_RETRIES`), burning ~20s per turn. `maxOutputTokens` is set at the `streamText` call level, so the full thinking budget stays reserved even on step one where `prepareStep` disables thinking and swaps in haiku-4.5 (real case: 148_628 text + 11_872 tool + 52_000 output = 212_500; dropping the unused 20k reservation alone would have fit). `ESTIMATED_TOKENS_PER_MESSAGE = 200` also sizes the recent window by message *count*, so a 12-message history holding ~235k tokens of uploaded documents summarized only 1 message. When budgeting, subtract the reserved output window and tool-schema size from `getMaxContextTokens`, and don't reserve `thinkingBudget` on a thinking-disabled step.
- Local dev needs `AP_EDITION=ee` + `AP_DB_TYPE=POSTGRES` + Redis; refuses PGLite. Debug a run with `npm run chat:logs -- <conversationId> [runId]` (needs `LOG_FILE=true`/`AP_LOG_FILE=true` set when the turn ran — otherwise `.evlog/logs` is empty).

### Key files
Entry point: `chatModule`, the Fastify plugin registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/ee/chat/` — the API module: controller, service, helpers, approval gate, compaction, rollout, console sync, entities, plus `tools/`, `mcp/`, `prompt/`, `history/` subdirs
- `packages/server/worker/src/lib/execute/jobs/ee/chat/` — where the LLM loop actually runs: `execute-chat-agent.ts` job handler (+ the three liveness timers + `streamChunksToClient` idle watchdog), `run-chat-turn.ts` DI streaming loop, `chat-worker-tools.ts` tool defs
- `packages/server/utils/src/chat-ai-utils.ts` — the `chatAiUtils` bag: `createChatModel` per provider, `supportsWebSearch`/`buildWebSearchTools`, `collapseStaleToolOutputs` history hygiene
- `packages/core/shared/src/lib/ee/chat/` — shared zod schemas and types, `tool-phases.ts` gating, `tool-classification.ts`, `chat-visibility.ts`
- `packages/server/api/src/assets/prompts/` — system prompt + project-context markdown and the on-demand `guides/`; chat-eval fixtures live in `packages/server/worker/test/lib/chat-eval/fixtures/`
- `packages/web/src/app/routes/chat-with-ai/` — the chat page, chat box, conversation list, and `components/` cards
- `packages/web/src/features/chat/` — API client, Zustand store, `use-chat.ts`, `chunk-reducer.ts`, streaming and voice hooks

Paths verified 2026-07-19. An earlier version pointed at `ee/chat/chat-model-factory.ts` and `ee/chat/chat-history-hygiene.ts`; both were folded into `packages/server/utils/src/chat-ai-utils.ts`.
