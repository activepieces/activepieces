# Think + Work — Design Document

> **"The most obvious tool for companies to give AI to all employees."**
>
> A chat interface where users interact with AI agents connected to their tools. Think and Work are one product.

---

## 1. Why P1

- Core to Activepieces vision — chat is the new entry point for non-technical users
- 12 Pylon tickets on AI & MCP (very high signal)
- Market: Dust, Writer, Dan, Viktor are all chat-first
- Confirmed: Think and Work should be one product

---

## 2. V1 Scope (Ship Fast)

| Feature | Status | Notes |
|---------|--------|-------|
| Core chat UI with conversation history | **Build** | Extend existing chat components |
| Connect to user's tools via MCP | **Reuse** | MCP infra exists from V2 |
| Agent execution from chat with streaming | **Build** | Agent engine exists but needs SSE bridge |
| Admin toggle: enable/disable + select models | **Reuse** | AI provider CRUD exists |
| Multi-turn context (agent remembers conversation) | **Build** | No conversation persistence today |
| File upload support | **Reuse** | Chat input already supports file attachment |

### Explicitly NOT V1

- Computer Use / browser automation fallback
- Voice input
- Agent-to-agent routing (swarms)
- Proactive suggestions within chat
- Embeddable widget / public standalone page
- Artifact side panel
- Agent analytics

---

## 3. What Already Exists (Reuse Map)

### Chat UI Components (`packages/web/src/features/chat/`)

| Component | What It Does | Reusable? |
|-----------|-------------|-----------|
| `ChatInput` (`chat-input/index.tsx`) | Text input, file upload (button + drag-drop + paste), Enter-to-send, Shift+Enter newline, file preview | Yes — use as-is |
| `ChatMessageList` (`chat-message-list/index.tsx`) | Renders message history, loading spinner, error bubble with retry, auto-scroll | Yes — extend for streaming + tool calls |
| `ChatBubble` (`chat-bubble/index.tsx`) | Message container (sent/received), avatar, message body, action buttons | Yes — extend with tool call cards |
| `MultiMediaMessage` (`chat-message/index.tsx`) | Text + file attachments, image detection, inline preview | Yes — use as-is |
| `ChatIntro` (`chat-intro.tsx`) | Welcome screen with bot name/logo | Yes — extend with suggested prompts |
| `FlowChat` (`routes/chat/flow-chat.tsx`) | Full chat orchestration: session IDs, message sending, error handling, scroll | Yes — refactor as base for Think+Work chat |

**Gaps in existing UI:**
- No token-by-token streaming (currently receives full markdown responses)
- No tool call visualization (no "thinking" or "calling tool X" cards)
- No conversation sidebar / history list
- No structured output rendering

### MCP Infrastructure

| Component | Location | What It Does |
|-----------|----------|-------------|
| MCP Service | `server/api/src/app/mcp/mcp-service.ts` | Builds MCP server from project flows, registers tools with Zod schemas, handles auth |
| MCP Tools | `server/api/src/app/mcp/tools/` | 20+ built-in tools (list_flows, create_flow, manage tables, etc.) |
| MCP Client in Agent | `pieces/community/ai/src/lib/actions/agents/tools.ts:72-103` | Creates MCP client per server, fetches tools, flattens for AI SDK |
| MCP Shared Types | `shared/src/lib/automation/mcp/mcp.ts` | McpServer, McpToolDefinition, protocols (SSE, HTTP, Streamable HTTP) |
| MCP OAuth | `server/api/src/app/mcp/oauth/` | Full OAuth flow for external MCP servers (PKCE, token refresh) |
| MCP Controller | `server/api/src/app/mcp/mcp-controller.ts` | REST endpoints for MCP server CRUD |

**MCP is ready for V1.** The agent can already discover and call tools from MCP servers. The gap is connecting this to a chat session instead of a flow step.

### Agent Execution Engine (`pieces/community/ai/src/lib/actions/agents/`)

| Component | What It Does |
|-----------|-------------|
| `run-agent.ts` (lines 204-308) | Streaming loop: `for await (chunk of stream.fullStream)` handles text-delta, tool-call, tool-result, tool-error, reasoning-delta |
| `agent-output-builder.ts` | Builds structured AgentResult with steps (MARKDOWN blocks + TOOL_CALL blocks with timing, input, output) |
| `tools.ts` | Constructs tool set from PIECE, FLOW, MCP, KNOWLEDGE_BASE tool configs |
| `ai-sdk.ts` | Vercel AI SDK v6 integration, provider abstraction, model instantiation |

**Agent engine is ready.** The streaming loop already processes all the right event types. The gap is piping these events through SSE to the frontend instead of accumulating them into a flow step output.

### AI Provider Management (`server/api/src/app/ai/`)

| Endpoint | Purpose |
|----------|---------|
| `GET /ai` | List configured providers |
| `GET /ai/:provider/models` | List available models for a provider |
| `POST /ai` | Create provider config (validates credentials, encrypts auth) |
| `POST /ai/:id` | Update provider config |
| `DELETE /ai/:id` | Delete provider |

**Providers:** OpenAI, Anthropic, Google Gemini, Azure OpenAI, OpenRouter, Cloudflare Gateway, ActivepiecesAI (built-in credit-based).

**Admin toggle is partially ready.** Provider CRUD exists. Need to add: (1) platform-level enable/disable toggle, (2) model allowlist per project.

### Chat State (`packages/web/src/app/builder/state/chat-state.ts`)

Currently a minimal Zustand store: `chatSessionMessages`, `chatSessionId`, `chatDrawerOpenSource`. In-memory only, no persistence. Will need to be replaced with a proper conversation store backed by the API.

---

## 4. Architecture

### 4.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│                                                             │
│  ┌─ Conversation Sidebar ─┐  ┌─ Chat Panel ──────────────┐ │
│  │  [+ New Chat]           │  │  [Messages + Streaming]   │ │
│  │  Today                  │  │  [Tool Call Cards]        │ │
│  │   • Sales analysis      │  │  [File Previews]         │ │
│  │   • Bug report          │  │                          │ │
│  │  Yesterday              │  ├──────────────────────────┤ │
│  │   • Q1 summary          │  │  [📎] Message input  [→] │ │
│  └─────────────────────────┘  └──────────────────────────┘ │
│                                                             │
│         POST /v1/chat/conversations/:id/messages            │
│         GET  /v1/chat/conversations/:id/messages/stream     │
└──────────────────────────┬──────────────────────────────────┘
                           │ SSE
┌──────────────────────────┼──────────────────────────────────┐
│                   Backend (Fastify)                          │
│                          │                                  │
│  ┌───────────────────────▼────────────────────────────────┐ │
│  │              Chat Controller                            │ │
│  │  POST /conversations          — Create conversation     │ │
│  │  GET  /conversations          — List conversations      │ │
│  │  GET  /conversations/:id      — Get conversation        │ │
│  │  DEL  /conversations/:id      — Delete conversation     │ │
│  │  POST /conversations/:id/msg  — Send message (→ SSE)    │ │
│  │  GET  /conversations/:id/msg  — Get message history     │ │
│  └───────────────────────┬────────────────────────────────┘ │
│                          │                                  │
│  ┌───────────────────────▼────────────────────────────────┐ │
│  │              Chat Service                               │ │
│  │  1. Save user message to DB                             │ │
│  │  2. Load conversation history (multi-turn context)      │ │
│  │  3. Resolve tools: MCP servers + pieces + flows + KB    │ │
│  │  4. Call Vercel AI SDK streamText()                     │ │
│  │  5. Stream events back via SSE                          │ │
│  │  6. Save assistant message + tool calls to DB           │ │
│  └────┬──────────┬──────────┬──────────┬──────────────────┘ │
│       │          │          │          │                    │
│  ┌────▼───┐ ┌───▼────┐ ┌───▼───┐ ┌───▼──────────┐        │
│  │ Pieces │ │ Flows  │ │  MCP  │ │ Knowledge    │        │
│  │ (acts) │ │(webhk) │ │Servers│ │ Base (RAG)   │        │
│  └────────┘ └────────┘ └───────┘ └──────────────┘        │
│                                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL                                 │ │
│  │  chat_conversation — history per user per project       │ │
│  │  chat_message — all messages, tool calls, files         │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model (V1)

```sql
-- Conversations (one per chat thread)
chat_conversation
├── id            UUID (PK)
├── projectId     UUID (FK → project)
├── userId        UUID (FK → user) — who created this conversation
├── title         VARCHAR — auto-generated from first message, editable
├── modelProvider VARCHAR — provider used (openai, anthropic, etc.)
├── modelName     VARCHAR — specific model (gpt-4o, claude-sonnet, etc.)
├── created       TIMESTAMP
├── updated       TIMESTAMP

-- Messages (all turns in a conversation)
chat_message
├── id              UUID (PK)
├── conversationId  UUID (FK → chat_conversation)
├── role            ENUM ('user', 'assistant', 'tool')
├── content         TEXT — markdown content
├── toolCalls       JSONB — array of { toolName, toolCallId, input, output, status, type, timing }
├── fileUrls        TEXT[] — array of file URLs (uploaded or generated)
├── tokenUsage      JSONB — { inputTokens, outputTokens }
├── created         TIMESTAMP
```

**Design decisions:**
- No separate `chat_agent` entity in V1 — the conversation itself stores model selection. Agent configuration comes in V2.
- `toolCalls` stored as JSONB on the message row — keeps the schema simple and queries fast.
- `fileUrls` as a text array — files stored in the existing file storage system.
- User scoping via `userId` on conversation — every user sees only their own conversations.

### 4.3 Streaming Protocol (SSE)

When the user sends a message, the backend responds with an SSE stream:

```
POST /v1/chat/conversations/:id/messages
Content-Type: application/json
{ "content": "Analyze Q1 sales", "files": [...] }

→ Response: text/event-stream

event: message_start
data: {"messageId":"msg_abc123","role":"assistant"}

event: content_delta
data: {"text":"I'll analyze "}

event: content_delta
data: {"text":"the Q1 sales data"}

event: tool_call_start
data: {"toolCallId":"tc_1","toolName":"query_sales_db","input":{"query":"SELECT..."}}

event: tool_call_end
data: {"toolCallId":"tc_1","output":{"rows":[...]},"durationMs":1200}

event: content_delta
data: {"text":"Based on the data, revenue grew 23%..."}

event: message_end
data: {"tokenUsage":{"inputTokens":1250,"outputTokens":340}}
```

**Why SSE (not WebSocket):**
- Unidirectional streaming is sufficient (user sends via POST, receives via SSE)
- Simpler than WebSocket — no connection management, automatic reconnection
- Compatible with Fastify, CDNs, proxies, load balancers
- Same pattern as OpenAI, Anthropic, and Vercel AI SDK APIs

### 4.4 Multi-Turn Context

On each new message, the Chat Service:

1. Loads the last N messages from `chat_message` for this conversation
2. Converts them to the Vercel AI SDK `CoreMessage[]` format:
   ```ts
   messages = [
     { role: 'user', content: 'What were Q1 sales?' },
     { role: 'assistant', content: 'Q1 revenue was $2.3M...' },
     { role: 'user', content: 'How does that compare to Q4?' },  // latest
   ]
   ```
3. Passes the full array to `streamText()` — the model sees the entire conversation

**Context window management (V1 — keep it simple):**
- Window of last 50 messages (configurable)
- When exceeded, drop oldest messages (not the system prompt)
- No summarization in V1 — add in future if needed

### 4.5 File Upload Flow

```
User drops file → ChatInput captures File object
                → POST /v1/chat/conversations/:id/messages (multipart/form-data)
                → Backend stores file in file storage (existing infra)
                → File URL saved in chat_message.fileUrls
                → File content extracted (text for PDFs/docs, base64 for images)
                → Injected into user message as content part for the model
```

**Supported file types (V1):**
- Images (PNG, JPG, GIF, WebP) — sent as image content parts to vision models
- Text files (TXT, CSV, JSON, MD) — content injected as text
- PDFs — text extracted and injected
- Documents (DOCX) — text extracted and injected

---

## 5. Frontend Design

### 5.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─ App Shell (existing) ──────────────────────────────────────┐│
│  │  [Sidebar: Flows | Tables | Chat | Connections | ...]      ││
│  │           ↓ active                                          ││
│  │  ┌─ Chat Page ────────────────────────────────────────────┐ ││
│  │  │                                                        │ ││
│  │  │  ┌─ Conversations ─┐  ┌─ Chat Panel ────────────────┐ │ ││
│  │  │  │                 │  │                              │ │ ││
│  │  │  │ [+ New Chat]    │  │  ┌─ Header ───────────────┐ │ │ ││
│  │  │  │                 │  │  │ Model: [GPT-4o ▾]      │ │ │ ││
│  │  │  │ Today           │  │  └────────────────────────┘ │ │ ││
│  │  │  │  ◦ Sales Q1     │  │                              │ │ ││
│  │  │  │  ◦ Bug #432     │  │  (empty state)               │ │ ││
│  │  │  │                 │  │                              │ │ ││
│  │  │  │ Yesterday       │  │  "What can I help you with?" │ │ ││
│  │  │  │  ◦ Deploy plan  │  │                              │ │ ││
│  │  │  │                 │  │  [Suggested prompt 1]        │ │ ││
│  │  │  │ Last 7 days     │  │  [Suggested prompt 2]        │ │ ││
│  │  │  │  ◦ Migration    │  │  [Suggested prompt 3]        │ │ ││
│  │  │  │                 │  │                              │ │ ││
│  │  │  │                 │  │                              │ │ ││
│  │  │  │                 │  │                              │ │ ││
│  │  │  │                 │  │                              │ │ ││
│  │  │  │                 │  ├──────────────────────────────┤ │ ││
│  │  │  │                 │  │ [📎] Ask anything...    [→]  │ │ ││
│  │  │  └─────────────────┘  └──────────────────────────────┘ │ ││
│  │  └────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Chat Message States

**User Message:**
```
┌─────────────────────────────────────────────┐
│                          Can you check the  │
│                          status of order     │
│                          #12345?            │
│                          📄 invoice.pdf      │
└─────────────────────────────────────────────┘
```

**Assistant Message (streaming):**
```
┌─────────────────────────────────────────────┐
│  I'll look up that order for you.           │
│                                             │
│  ┌─ 🔧 Calling: query_orders ───────────┐  │
│  │  ⏳ Running...                         │  │
│  └───────────────────────────────────────┘  │
│  █  (blinking cursor)                       │
└─────────────────────────────────────────────┘
```

**Assistant Message (complete, tool call expandable):**
```
┌─────────────────────────────────────────────┐
│  I'll look up that order for you.           │
│                                             │
│  ┌─ ✅ query_orders (1.2s) ──────── [▶] ─┐ │
│  └───────────────────────────────────────┘  │
│                                             │
│  Order #12345 is **shipped** as of April 7. │
│  Tracking: UPS 1Z999AA10123456784           │
│  Expected delivery: April 11.               │
└─────────────────────────────────────────────┘
```

**Tool Call Expanded:**
```
┌─ ✅ query_orders (1.2s) ──────────── [▼] ─┐
│  Input:                                     │
│  { "orderId": "12345" }                     │
│                                             │
│  Output:                                    │
│  { "status": "shipped",                     │
│    "tracking": "1Z999AA10123456784",        │
│    "carrier": "UPS" }                       │
└─────────────────────────────────────────────┘
```

### 5.3 Model Selector

In the chat header, a dropdown to pick the model:

```
┌─ Model ────────────────────────┐
│  ┌─────────────────────────┐   │
│  │ GPT-4o            ▾     │   │
│  └─────────────────────────┘   │
│                                │
│  Dropdown:                     │
│  ── OpenAI ──                  │
│    ○ GPT-4o                    │
│    ○ GPT-4o-mini               │
│  ── Anthropic ──               │
│    ○ Claude Sonnet 4           │
│    ○ Claude Haiku 3.5          │
│  ── Google ──                  │
│    ○ Gemini 2.5 Pro            │
└────────────────────────────────┘
```

- Only shows models from providers the admin has enabled
- Selection persists per conversation (stored in `chat_conversation.modelName`)
- Can be changed mid-conversation (next message uses new model)

### 5.4 Admin Settings

Under **Platform Settings → AI**:

```
┌─ AI Settings ──────────────────────────────────────────┐
│                                                        │
│  Chat Feature: [● Enabled  ○ Disabled]                 │
│                                                        │
│  ┌─ Available Models ──────────────────────────────┐   │
│  │  ☑ OpenAI GPT-4o                                │   │
│  │  ☑ OpenAI GPT-4o-mini                           │   │
│  │  ☐ Anthropic Claude Opus 4                      │   │
│  │  ☑ Anthropic Claude Sonnet 4                    │   │
│  │  ☑ Google Gemini 2.5 Pro                        │   │
│  │  ...                                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  Default Model: [GPT-4o ▾]                             │
│                                                        │
│  [Save]                                                │
└────────────────────────────────────────────────────────┘
```

---

## 6. Backend Implementation

### 6.1 New Module: `packages/server/api/src/app/chat/`

```
chat/
├── chat-controller.ts       — Fastify routes (conversations + messages)
├── chat-service.ts          — Business logic (create, send, stream)
├── chat-entity.ts           — TypeORM entities (conversation + message)
├── chat-agent-executor.ts   — Bridge between chat and Vercel AI SDK agent
└── chat-types.ts            — Request/response schemas (TypeBox)
```

### 6.2 API Endpoints

```
POST   /v1/chat/conversations                    — Create new conversation
GET    /v1/chat/conversations                    — List user's conversations (paginated)
GET    /v1/chat/conversations/:id                — Get conversation with recent messages
DELETE /v1/chat/conversations/:id                — Delete conversation
PATCH  /v1/chat/conversations/:id                — Update title, model

POST   /v1/chat/conversations/:id/messages       — Send message → SSE stream response
GET    /v1/chat/conversations/:id/messages        — Get message history (paginated, cursor-based)

POST   /v1/chat/conversations/:id/messages/:msgId/stop  — Cancel in-progress generation
```

### 6.3 Agent Executor Bridge

The key new code: connecting the chat request to the existing agent engine.

```ts
// chat-agent-executor.ts (pseudocode)

async function executeAndStream({ conversation, userMessage, reply }) {
  // 1. Load conversation history
  const history = await chatService.getMessages(conversation.id, { limit: 50 })
  const coreMessages = toCoreMessages(history)

  // 2. Resolve available tools
  const mcpServers = await mcpService.getByProjectId(conversation.projectId)
  const tools = await buildToolSet({
    mcpServers,
    projectId: conversation.projectId,
    // In V1: all MCP tools available. Future: configurable per agent.
  })

  // 3. Stream with Vercel AI SDK
  const result = streamText({
    model: getModel(conversation.modelProvider, conversation.modelName),
    messages: [...coreMessages, { role: 'user', content: userMessage.content }],
    tools,
    maxSteps: 20,
  })

  // 4. Pipe events to SSE
  for await (const chunk of result.fullStream) {
    switch (chunk.type) {
      case 'text-delta':
        reply.sse({ event: 'content_delta', data: { text: chunk.textDelta } })
        break
      case 'tool-call':
        reply.sse({ event: 'tool_call_start', data: { ... } })
        break
      case 'tool-result':
        reply.sse({ event: 'tool_call_end', data: { ... } })
        break
    }
  }

  // 5. Save complete assistant message to DB
  await chatService.saveMessage({ conversationId, role: 'assistant', ... })

  reply.sse({ event: 'message_end', data: { tokenUsage } })
}
```

**Key insight:** The streaming loop in `run-agent.ts` (lines 204-308) already handles all chunk types. The new executor reuses the same pattern but outputs SSE events instead of building an `AgentResult` object.

### 6.4 Tool Resolution (V1)

In V1, the chat agent gets access to:

1. **All MCP servers** configured in the user's project — these already expose flows-as-tools and built-in Activepieces tools
2. **Knowledge bases** in the project — for RAG

This means users don't need to configure tools per chat — they get everything their project has. The MCP infrastructure already handles tool discovery and execution.

---

## 7. Sandbox Execution Tools (Future Reference)

Three tools from the Rivet ecosystem evaluated for future code execution capabilities:

### 7.1 Sandbox Agent SDK (`sandboxagent.dev`)

Open-source HTTP/SSE server + TypeScript SDK for running AI coding agents (Claude Code, Codex, OpenCode) inside isolated sandboxes. Rust binary runs inside the container, adapter pattern normalizes agent APIs.

- **Strengths:** Unified API across 6+ coding agents, session persistence (Postgres/SQLite), virtual desktop with WebRTC, deploy on E2B/Daytona/Docker/Vercel/Cloudflare
- **Weakness:** Cold start 440ms–3150ms (container dependent), heavier resource footprint
- **Best for:** Full coding agent sessions with file system, terminal, desktop access
- **License:** Apache-2.0, free

### 7.2 agent-os (`github.com/rivet-dev/agent-os`)

In-process virtual OS with Rust kernel. Provides filesystem, networking, process management, and multiple runtimes (WASM, V8, Python) without containers.

- **Strengths:** ~5ms cold start, ~22-131MB per instance, 3-17x cheaper than containers, POSIX environment (coreutils, curl, jq, ripgrep, sqlite3), multiplayer sessions, built-in workflows/cron/webhooks
- **Weakness:** Newer project, limited to what WASM/V8 can run (no native binaries)
- **Best for:** High-density multi-tenant agent hosting (~30 sessions on 4GB server)
- **License:** Apache-2.0

### 7.3 secure-exec (`github.com/rivet-dev/secure-exec`)

Lightweight library for secure Node.js code execution. V8 isolate isolation with virtual kernel and full Node.js API polyfills. The building block that agent-os extends.

- **Strengths:** ~16ms cold start, ~3.4MB per instance, 45-380x cheaper than containers, direct Vercel AI SDK tool integration, zero container overhead
- **Weakness:** JavaScript/TypeScript only (no Python without Pyodide), no persistent filesystem
- **Best for:** Simple code snippet execution as a tool
- **License:** Apache-2.0

### 7.4 Recommendation for Future Phases

| Phase | Need | Tool |
|-------|------|------|
| V1 | No code execution needed | N/A — MCP tools are sufficient |
| V2 (code exec) | Agent runs JS/Python snippets | **secure-exec** — lightest, fastest, integrates as AI SDK tool |
| V3 (computer use) | Browser automation, native apps | **Sandbox Agent SDK** — full container with desktop capabilities |

---

## 8. Implementation Plan

### Phase 1: Backend Foundation

1. **Database migration** — Create `chat_conversation` and `chat_message` tables
2. **Chat entity** — TypeORM entities with relations
3. **Chat service** — CRUD for conversations and messages
4. **Chat controller** — Fastify routes with TypeBox validation
5. **Agent executor** — Bridge between chat service and Vercel AI SDK `streamText()`, SSE output
6. **Tool resolution** — Connect project's MCP servers + knowledge bases as tools

### Phase 2: Frontend Chat UI

1. **Chat page route** — New route in app sidebar (`/chat`)
2. **Conversation sidebar** — List, create, delete, rename conversations
3. **Streaming message renderer** — Token-by-token text, tool call cards (reuse/extend existing `ChatMessageList`)
4. **Model selector** — Dropdown in chat header, populated from admin-enabled models
5. **File upload** — Reuse existing `ChatInput` with file attachment
6. **Stop generation** — Cancel button that aborts the SSE stream

### Phase 3: Admin Controls

1. **Chat feature toggle** — Platform setting to enable/disable
2. **Model allowlist** — Admin picks which models users can select
3. **Default model** — Pre-selected model for new conversations

### Phase 4: Polish

1. **Auto-title** — Generate conversation title from first message (LLM call or first 50 chars)
2. **Error handling** — Graceful recovery on stream errors, model failures, tool timeouts
3. **Loading states** — Skeleton screens, typing indicators
4. **Keyboard shortcuts** — Cmd+K to start new chat, Cmd+Shift+Delete to clear

---

## 9. Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Streaming protocol | SSE (not WebSocket) | Unidirectional is sufficient; simpler; works with CDNs; matches OpenAI/Anthropic pattern |
| AI SDK | Vercel AI SDK v6 (already in codebase) | Handles streaming, tool calling, multi-provider; React hooks available (`useChat`) |
| Tool connectivity | MCP (existing infra) | Already connects flows-as-tools, has auth, tool discovery, permission control |
| Conversation storage | PostgreSQL | Conversations are valuable data; consistent with existing data layer; pgvector available for future memory features |
| V1 agent config | Per-conversation model selection only | Ship fast — no separate agent entity. Agent config (system prompt, tool selection) comes in V2 |
| Context window | Last 50 messages, truncate oldest | Simple and predictable. Summarization/vector memory is future work |

---

## 10. Open Questions

1. **System prompt in V1** — Should there be a default system prompt? Or is the model used as-is with just the conversation + tools?
2. **Tool visibility** — Should users see all MCP tools the agent has access to, or is it transparent?
3. **Conversation limits** — Max conversations per user? Max messages per conversation?
4. **Token tracking** — Do we track and display token usage per conversation? Important for cost visibility.
5. **Model switching mid-conversation** — Allow it? It may confuse context if models have different capabilities.
6. **Navigation** — Is Chat a top-level sidebar item alongside Flows and Tables?
