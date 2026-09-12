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

### 🤖 Agent
A flow step that runs an autonomous LLM loop rather than a single call. Its **AgentTool**s are Piece, Flow, MCP, or Knowledge Base handles.

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
