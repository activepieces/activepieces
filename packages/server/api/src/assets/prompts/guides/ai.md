# Native AI in flows

Activepieces has first-class AI via the `ai` piece (`@activepieces/piece-ai`) and the Agent. **Prefer these over hand-rolling HTTP calls to a model API** — they use the platform's configured AI providers, so the user manages keys/models centrally. Discover available models with `ap_list_ai_models`; the user adds providers (OpenAI, Anthropic, Google, OpenRouter, …) in settings (`ap_setup_guide` topic `ai_provider`).

**Always use the native `@activepieces/piece-ai` piece for AI work — never a vendor-specific piece (the OpenAI piece, Anthropic piece, etc.) and never a raw model API call.** This holds even if the user names a model or provider ("use GPT-4o"): the native piece routes to that provider through the platform's central config, so you get the same model without a per-flow vendor connection. The native piece needs **no per-flow AI credential** — it draws on the providers the platform already has. So when you discover there is no OpenAI (or other vendor) credential, that is the *reason* to use the native piece, not a blocker: build with `@activepieces/piece-ai` and keep moving. Never insist on the OpenAI piece — or stall asking the user to connect one — after finding no credential.

## The `ai` piece actions — and their output shapes

Output shape decides how you reference the result. Get this wrong and `{{...}}` silently resolves to empty.

| Action (`name`) | Use it for | Output | Reference as |
|---|---|---|---|
| Ask AI (`askAi`) | free-form prompt → text | **raw string** (or `{text, sources}` only if web-search + include-sources is enabled) | `{{step_N['output']}}` |
| Classify Text (`classifyText`) | choose one label from a set | **raw string** (the label) | `{{step_N['output']}}` |
| Summarize Text (`summarizeText`) | condense text | **raw string** | `{{step_N['output']}}` |
| Extract Structured Data (`extractStructuredData`) | text → typed object via a schema | **object** (your schema's fields) | `{{step_N['output'].fieldName}}` |
| Run Agent (`run_agent`) | a tool-using agent that handles a whole sub-task | **object** `{ status, steps, structuredOutput?, prompt }` | `{{step_N['output'].structuredOutput.field}}` |

**The #1 AI gotcha:** `askAi`, `classifyText`, and `summarizeText` return a **raw string** — the whole `['output']` *is* the string: reference `{{step_N['output']}}`, never `{{step_N['output'].text}}`. Only `extractStructuredData` and `run_agent` return objects you dot into. Always confirm with `ap_test_step`.

## Giving Run Agent its own tools

`run_agent` can call other Activepieces pieces as tools. When you configure a piece tool, its `predefinedInput.auth` must be the **bare connection reference string** — exactly `{{connections['<externalId>']}}` — never an object. Do NOT wrap it like `{ "accessToken": "{{connections['…']}}" }`; that breaks OAuth pieces (the piece reads the unwrapped token and finds nothing). For pieces that need no connection (e.g. Webhook, Schedule), omit `auth` entirely. The connection's externalId comes from `ap_list_connections` / the connection picker, the same id you'd use anywhere else.

## Classify-then-route (the workhorse)

To let AI make a decision the flow branches on:

1. Use `classifyText` (or `extractStructuredData` with an enum field for strictness) and **constrain the output to a closed set** in the prompt — e.g. *"Return exactly one of: urgent, normal, low."*
2. Add a `ROUTER` right after, one condition branch per value: `TEXT_EXACTLY_MATCHES {{step_N['output']}} = "urgent"`, plus `Otherwise`.

The router only works if the AI output is pinned to the exact values the branches match. Unconstrained prompts + `TEXT_CONTAINS` are fragile — small wording drift breaks routing.

## Score-gate with human escalation

For "AI decides, a human only handles the hard ones": AI emits a confidence score → router: high → auto-proceed, low → auto-reject, middle → human approval (see `ap_load_guide('error_handling')`). This collapses human review down to the borderline cases instead of everything.

## AI step vs CODE step — you decide, never ask

This is your call, not the user's — never surface it as a question. The rule:
- **Language, drafting, summarizing, classifying, extracting, judgment** → use the native AI piece (`@activepieces/piece-ai`). When a task could plausibly go either way (e.g. "draft a reply", "summarize these", "categorize this"), **default to the AI piece** — don't quietly build a CODE step that hard-codes rules for something that's really a language/judgment task.
- **Deterministic comparisons, arithmetic, reshaping/formatting data** → use a router condition or a `CODE` step. They run instantly, free, and exactly.

Don't use `askAi` as a comparison or arithmetic engine (e.g. "did the price change?", "is this number bigger?"). A router condition or a `CODE` step does it deterministically, instantly, and free. Use AI for language, extraction, and judgment — not exact comparisons or math.

## Feeding AI output into an email (or other formatted destination)

When an AI step's text becomes an email body, format it for that destination — clean paragraphs or simple HTML, not raw model scratch/markdown the user wouldn't want to receive. Instruct the AI step to produce send-ready content, map it to the **correct body field** (HTML body vs plain-text body — check the field names with `ap_get_piece_props`), and confirm with `ap_test_step` that the body actually renders non-empty before sharing. An email step that "succeeds" with an empty or mis-mapped body is a silent failure.
