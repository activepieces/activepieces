---
icon: 🧠
---

# AI & Intelligence

The AI layer: which model backends a platform may use, how usage is metered, and the surfaces that consume them (the Agent step, the MCP server, the copilot). Glossary of the terms that only mean something here; each page below holds the detail.

### 🔌 AI Provider
A configured LLM backend (OpenAI, Anthropic, Google, Azure, OpenRouter, Cloudflare, Custom, or Activepieces-hosted) with encrypted credentials, resolved per platform.

### 🪙 AI Credits
The metered currency for AI usage — 1000 credits = $1 — backed by per-key OpenRouter limits. A quota, not a wallet.
- *Avoid:* "tokens" for the billing unit; tokens are the model's unit, credits are ours.

### 🤖 Agent
A flow step that runs an autonomous LLM loop rather than a single call. Its **AgentTool**s are Piece, Flow, MCP, or Knowledge Base handles.

### 🔗 MCP Server
The per-project endpoint that exposes Activepieces tools to an external AI assistant. Distinct from a **piece** that *calls* an MCP server.

## Pages

- **AI Providers** — configuring backends, credential storage, credit metering
- **AI Agents** — the Agent step and its tool types
- **MCP Server** — the per-project endpoint, tool exposure, visibility rules
- **AI & MCP** — how the AI and MCP surfaces fit together

## Related

Knowledge Base lives in [Data, Storage & Observability](../data-storage-observability/index.md) — it is a document store first, an AI tool second.
