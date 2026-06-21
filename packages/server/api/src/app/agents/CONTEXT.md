# AI & Agents

The AI surface of Activepieces: autonomous agent steps, the knowledge bases and providers that back them, the credit currency that meters usage, and the MCP endpoint that exposes tools to external clients.

## Language

**Agent**:
A flow step type that runs an LLM-driven autonomous loop, calling tools until it produces a final answer.
_Avoid_: AI step, bot

**AgentTool**:
A discriminated union of the tool types attachable to an agent step: Piece, Flow, MCP, or Knowledge Base.

**Knowledge Base**:
A document store for AI agents that chunks files into vector-embedded segments for semantic search.
_Avoid_: RAG store, document index

**AI Provider**:
A configured LLM backend (OpenAI, Anthropic, Google, Azure, OpenRouter, Cloudflare, Custom, or Activepieces) with encrypted credentials.
_Avoid_: model provider, LLM config

**AI Credits**:
A metered currency (1000 credits = $1 USD) for AI usage, backed by OpenRouter API key limits.
_Avoid_: tokens, AI quota

**Platform Copilot**:
A RAG-powered assistant that helps build flows by searching indexed code chunks and streaming AI responses.
_Avoid_: AI assistant, flow builder AI

**MCP Server**:
A per-project Model Context Protocol endpoint that exposes Activepieces tools to AI clients (Claude Desktop, Cursor, etc.).
