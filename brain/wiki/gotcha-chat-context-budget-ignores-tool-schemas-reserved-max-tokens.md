---
icon: ⚠️
---

# Gotcha: chat context budget ignores tool schemas + reserved max_tokens

Anthropic/OpenRouter count `max_tokens` **and** tool-schema tokens against the 200k window, but the chat compactor budgets neither.

- `chat-compaction.ts` trims history to `COMPACTION_THRESHOLD (0.7) × 200_000 = 140_000` tokens, and its fit check (`finalEstimate > maxContext`) looks only at message chars.
- `run-chat-turn.ts:73` sets `maxOutputTokens: tier.thinkingBudget + 32_000` → **52_000 reserved on the premium tier**, plus ~12k of tool schemas (62 tools, 41 via MCP). 140k + 12k + 52k = 204k > 200k, so a conversation that compacts to just under the threshold still 400s with "maximum context length is 200000 tokens".
- `maxOutputTokens` is set at the `streamText` call level, so the full thinking budget stays reserved even on step one, where `prepareStep` disables thinking (`reasoning: {enabled:false}`) and swaps in the fast model (haiku-4.5). Real case: 148_628 text + 11_872 tool + 52_000 output = 212_500 — dropping the 20k unused thinking reservation alone would have fit.
- `ESTIMATED_TOKENS_PER_MESSAGE = 200` sizes the recent window by message *count*, so a 12-message history holding ~235k tokens of uploaded documents summarized only 1 message. All the real trimming fell to `buildCompactedPayload`'s char loop.
- A context-length 400 is deterministic but gets retried ~6× (`streamText maxRetries: 3` × our `MAX_STREAM_RETRIES`), burning ~20s per turn.

When budgeting chat context, subtract the reserved output window and the tool-schema size from `getMaxContextTokens`, and don't reserve `thinkingBudget` on a thinking-disabled step.
