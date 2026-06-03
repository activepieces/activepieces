# Native AI in flows

Activepieces has first-class AI via the `ai` piece (`@activepieces/piece-ai`) and the Agent. **Prefer these over hand-rolling HTTP calls to a model API** — they use the platform's configured AI providers, so the user manages keys/models centrally. Discover available models with `ap_list_ai_models`; the user adds providers (OpenAI, Anthropic, Google, OpenRouter, …) in settings (`ap_setup_guide` topic `ai_provider`).

## The `ai` piece actions — and their output shapes

Output shape decides how you reference the result. Get this wrong and `{{...}}` silently resolves to empty.

| Action (`name`) | Use it for | Output | Reference as |
|---|---|---|---|
| Ask AI (`askAi`) | free-form prompt → text | **raw string** (or `{text, sources}` only if web-search + include-sources is enabled) | `{{step_N}}` |
| Classify Text (`classifyText`) | choose one label from a set | **raw string** (the label) | `{{step_N}}` |
| Summarize Text (`summarizeText`) | condense text | **raw string** | `{{step_N}}` |
| Extract Structured Data (`extractStructuredData`) | text → typed object via a schema | **object** (your schema's fields) | `{{step_N.fieldName}}` |
| Run Agent (`run_agent`) | a tool-using agent that handles a whole sub-task | **object** `{ status, steps, structuredOutput?, prompt }` | `{{step_N.structuredOutput.field}}` |

**The #1 AI gotcha:** `askAi`, `classifyText`, and `summarizeText` return a **raw string** — reference the step directly as `{{step_N}}`, never `{{step_N.text}}` or `{{step_N.output}}`. Only `extractStructuredData` and `run_agent` return objects you dot into. Always confirm with `ap_test_step`.

## Classify-then-route (the workhorse)

To let AI make a decision the flow branches on:

1. Use `classifyText` (or `extractStructuredData` with an enum field for strictness) and **constrain the output to a closed set** in the prompt — e.g. *"Return exactly one of: urgent, normal, low."*
2. Add a `ROUTER` right after, one condition branch per value: `TEXT_EXACTLY_MATCHES {{step_N}} = "urgent"`, plus `Otherwise`.

The router only works if the AI output is pinned to the exact values the branches match. Unconstrained prompts + `TEXT_CONTAINS` are fragile — small wording drift breaks routing.

## Score-gate with human escalation

For "AI decides, a human only handles the hard ones": AI emits a confidence score → router: high → auto-proceed, low → auto-reject, middle → human approval (see `ap_get_guide(error-handling)`). This collapses human review down to the borderline cases instead of everything.

## When NOT to use AI

Don't use `askAi` as a comparison or arithmetic engine (e.g. "did the price change?", "is this number bigger?"). A router condition or a `CODE` step does it deterministically, instantly, and free. Use AI for language, extraction, and judgment — not exact comparisons or math.
