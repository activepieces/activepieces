# AI & Intelligence

The LLM-backed capabilities: provider configuration, the metered credit currency, and the in-product copilot.

## Language

**AI Provider**:
A configured LLM backend (OpenAI, Anthropic, Google, Azure, OpenRouter, Cloudflare, Custom, Activepieces) with encrypted credentials.
_Avoid_: model provider, LLM config

**AI Credits**:
A metered currency (1000 credits = $1 USD) for AI usage, backed by OpenRouter API key limits.
_Avoid_: tokens, AI quota

**AI Credit Usage**:
Per-project attribution of AI Credits, day-bucketed by provider and model; visibility only — billing stays pooled per platform.
_Avoid_: AI usage (the dropped legacy table), per-project billing

**Platform Copilot**:
A RAG-powered assistant that helps build flows by searching indexed code chunks and streaming AI responses.
_Avoid_: AI assistant, flow builder AI
