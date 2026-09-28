---
icon: 🧠
---

# AI & Intelligence

The AI layer: which model backends a platform may use, how usage is metered, and the surfaces that consume them (the Agent step, the MCP server, the copilot). Glossary of the terms that only mean something here; each page below holds the detail.

### 🔌 AI Provider
A configured LLM backend (OpenAI, Anthropic, Google, Azure, OpenRouter, Cloudflare, Custom, or Activepieces-hosted) with encrypted credentials, resolved per platform.

### 🪙 AI Credits
The metered currency for AI usage — one credit is `AP_AI_CREDIT_USD_VALUE` of model spend, $0.0005 by default — backed by per-key OpenRouter limits. A quota, not a wallet. A managed call is billed on the dollar cost the provider reports; a call on a customer's own key is billed one flat credit. See [decision 000037](../decisions/000037-ai-is-billed-on-what-the-call-cost-observed-at-the-worker.md).
- *Avoid:* "tokens" for the billing unit; tokens are the model's unit, credits are ours. *Avoid:* "credit weight" — the per-model weight table is gone.

### 🎚️ Model Tier
A named slot, Fast, Expert or Heavy, that a customer picks instead of a model, so we can move it to a newer model without a deploy. It carries `id`, `label`, `modelId`, an optional `nativeModelId` for a customer on their own key, and a `thinkingBudget`. Tiers are published to the CDN by the console (decision [000041](../decisions/000041-ai-model-tiers-are-published-to-the-cdn-from-a-second-console.md)) in two lists and fall back to `ACTIVEPIECES_CHAT_TIERS` in the release. Tier ids are `fast` / `smart` / `premium`; only `fast` matches its label (`smart` is Expert, `premium` is Heavy), so match on `id`, never the label. A tier id never contains `/`; a managed model id always does.
- **Flow tiers** — the `tiers` list; what FLOW_STEP and AGENT resolve against, the surfaces that name their own model. **Chat tiers** — the `chatTiers` list; what CHAT and AGENT_BUILDER resolve against. The chat list is optional and falls back to the flow list. In code the pair is `ModelTierSurface = 'chat' | 'flow'`.
- *Avoid:* "chat tier" for a model tier in general; say "model tier", and "chat tiers" only for the chat list. The other real axis is text vs image (`ACTIVEPIECES_IMAGE_TIERS`).

### 🤖 Agent
A flow step that runs an autonomous LLM loop rather than a single call. Its **AgentTool**s are Piece, Flow, MCP, or Knowledge Base handles.

### 🚪 Run source
The door an agent turn came through. `AgentRunSource` is CHAT (the assistant chat, an agent turn with no agent row), AGENT (chatting with a saved agent), AGENT_BUILDER (the chat that builds an agent) and FLOW_STEP (the `run_agent` action). All four create an `agent_conversation` row and run the same `EXECUTE_AGENT_RUN` worker job; the source decides the tool set, the system prompt and which tier list the model resolves against. See the four-doors table on the AI Agents page.
- *Avoid:* "surface" for the door itself; surface is the two-way `chat | flow` split the tier lists use, and two doors map onto each.

### ⚡ Direct AI step
A flow step that makes one model call and returns: Ask AI, Summarize Text, Classify Text, Extract Structured Data, Generate Image. The counterpart to an **Agent**, which loops — and the distinction decides how each reaches a model, see [decision 000035](../decisions/000035-direct-ai-steps-reuse-the-agents-suspend-and-resume-path.md).
- *Avoid:* "simple AI action" and "AI action" — both name the piece rather than the behaviour, and would wrongly include the Agent step, which also lives in the AI piece.

### 🔗 MCP Server
The per-project endpoint that exposes Activepieces tools to an external AI assistant. Distinct from a **piece** that *calls* an MCP server.

## Pages

- **AI Providers** — configuring backends, credential storage, credit metering
- **AI Agents** — the Agent step and its tool types
- **MCP Server** — the per-project endpoint, tool exposure, visibility rules
- **AI & MCP** — how the AI and MCP surfaces fit together

## Related

Knowledge Base lives in [Data, Storage & Observability](../data-storage-observability/index.md) — it is a document store first, an AI tool second.
