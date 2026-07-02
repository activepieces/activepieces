# Chat quality invariants — the "must keep working" registry

This is the single source of truth for the chat behaviors and system guarantees we have
deliberately built and do **not** want to silently regress. It was distilled from ~47 chat
dev sessions (chat-stage + chat-mentions + activepieces) plus the engineered behaviors in the
code. Every row links to the test that pins it — or is marked **GAP** (worth covering) or
**UX-not-gated** (real behavior we track but don't auto-test yet).

When you change chat, this file tells you what you might break and where the guardrail is.

## How we gate chat quality (two tiers)

| Command | What it runs | Needs a key? | Run it when |
|---|---|---|---|
| `npm run chat:quality` | All deterministic chat **backend** tests (phases, classification, MCP client, approval gate, history hygiene, loop logic, streaming). | No | **Always**, before merging any chat change. |
| `npm run chat-evals:ci` | The **agent-behavior** gate — fixtures replayed live against the model + LLM judge (`fixtures/*.json`). | Yes (OpenRouter, in `.env.dev`) | When you touch the **system prompt** or agent behavior. |
| `npm run chat-evals -- --fresh` | Interactive reviewer for the above (baseline HEAD vs working-tree prompt). | Yes | While iterating on a prompt change. |
| `npm run chat-evals:live` | Real-execution failure-mode harness (`live/scenarios.ts`) — side effects, dev only. | Yes | Exploratory regression sweeps, not CI. |

Layers: **AGT** = agent/LLM behavior (fixtures). **BE** = deterministic backend invariant (vitest).
**UX** = front-end behavior we rely on but do not auto-test this pass (documented for awareness).

## AGT — agent behavior (gated by `chat-evals`)

| ID | Invariant (must keep working) | Source | Coverage |
|---|---|---|---|
| AGT-01 | Reads the **outcome behind the verb**, not the literal action ("do my job" = act as the operator, not duplicate a flow). | persona-operator doctrine | `fixtures/intent-self-as-agent-*.json`, `fixtures/intent-do-it-not-guide.json` |
| AGT-02 | **Business-intent first** — leads with the business meaning; never opens with an account/setup inventory dump or a "which existing automation did you mean?" menu. | sessions; `chat-business-intent-first` | `fixtures/business-intent-first.json` *(new)* |
| AGT-03 | **Relentless escalation** on an empty result — retries on its own (different action / API / query), never hands the task back. | `close my deals` chain | `fixtures/intent-relentless-empty-escalate.json` |
| AGT-04 | **Orchestrates the complete solution** (composes multi-part play and executes), not a menu of partial helps. | orchestrate doctrine | `fixtures/orchestrate-complete-solution.json` |
| AGT-05 | **Mission-alignment checkpoint only** for consequential outward-facing bulk sends — otherwise executes end-to-end. | mission_alignment | `fixtures/mission-align-before-bulk-send.json` |
| AGT-06 | Persona: warm/expert, **energy-calibrated**, **no jargon**, conveys range. | persona doctrine | `fixtures/energy-calibration-frustrated.json`, `discovery-no-jargon.json`, `persona-mission-conveys-range.json`, `capability-range-yes-and.json` |
| AGT-07 | Anti-over-correction: a named-flow "clone/duplicate" copies that flow, **not** build-an-agent. | guard | `fixtures/guard-duplicate-flow-not-agent.json` |
| AGT-08 | Proactive, **no filler/quick-reply chips** in place of doing the work. | sessions | `fixtures/proactive-no-filler-chips.json` |
| AGT-09 | **No raw count/internal-number leak** into the user-facing reply. | sessions | `fixtures/no-count-leak.json` |
| AGT-10 | **Product/nav awareness** — points the user to the right place (e.g. Connections). | product_model | `fixtures/product-nav-awareness.json` |
| AGT-11 | **Shows the data, doesn't just claim it** — "do I have a leads table?" surfaces the actual rows, not just "yes". | session `5e569c61` | `fixtures/data-retrieval-shows-data.json` *(new)* |
| AGT-12 | On a connection **auth error**, offers to **reconnect inline**; never just dumps the user to the Connections page or gives up. | `chat-mcp-reconnect`, `chat-connection-reconnect-inline` | `fixtures/reconnect-offer-on-auth-error.json` *(new)* |
| AGT-13 | **Speed** — a direct, well-specified data op goes straight to the data with **no clarifying question card**. | `chat-speed-and-card-noise`, thinking-gate | `fixtures/speed-direct-data-op-no-card.json` *(new)* |
| AGT-14 | **Active-resource context** — "this table / this flow" resolves to the resource open in the Stage, doesn't ask which. | sessions `65d6322a`, `5e569c61` | **GAP** — harness has no ambient-context injection; needs a context-aware fixture path |
| AGT-15 | **Large data → `ap_run_code`** — processes an offloaded result via code (`inputs.data`) instead of re-reading the blob. | `chat-large-data-offload` | **GAP** — brittle to replay; candidate for the live harness |
| AGT-16 | **Investigate the dropped link FIRST** — a bare domain/URL/handle/file is an instruction to READ (fetch/scrape/search) before forming any interpretation or raising a card; what it reads decides the specifics (a designer's portfolio answers "which role"). No interpretation menu, no department pick-list. | sessions `JG1cnt3ciZ…` / `2EUESkZoZN…` (mahdif.com→Notion) | `fixtures/intent-investigate-link-before-asking.json` *(new)* |

## BE — backend invariants (gated by `chat:quality`)

| ID | Invariant (must keep working) | Coverage |
|---|---|---|
| BE-01 | Two-phase tool gating: discovery hides build-only tools (denylist, fail-open). | `packages/core/shared/test/ee/chat-tool-phases.test.ts` |
| BE-02 | Extended thinking is gated on **deep-reasoning tools**, decoupled from phase (table writes don't pay the thinking cost). | `chat-tool-phases.test.ts` |
| BE-03 | Tool classification read vs write (+ HTTP-method sniff for `custom_api_call`). | `packages/core/shared/test/ee/chat-tool-classification.test.ts` |
| BE-04 | **Raw HTTP (`custom_api_call`) is never gated** behind an approval card. | `chat-tool-classification.test.ts` (`requiresActionPreview`) |
| BE-05 | MCP **auth-error detection** (401/403/expired-token text), with connector-uuid parse. | `packages/server/worker/test/lib/execute/jobs/ee/chat/chat-mcp-client.test.ts` |
| BE-06 | MCP **circuit breaker** — flag a connector on first auth error, short-circuit its tools, re-open on reconnect. | `chat-mcp-client.test.ts` |
| BE-07 | **Selected-connection auth injection** into piece-introspection tools (never resolve props against a guessed externalId). | `chat-mcp-client.test.ts` (`injectSelectedAuth`) *(new)* |
| BE-08 | Large tool result **offloaded to a file + preview** (MCP) / multi-defense shrink (worker). | **GAP** — helpers internal; consider exporting `maybeOffloadMcpResult` / `clampResultSize` |
| BE-09 | Repeat identical-call **2-strike brake** + transient-vs-permanent failure classification. | `run-chat-turn-guards.test.ts` |
| BE-10 | Loop decision (nudge / continue / finish), single stream-retry before visible output. | `execute-chat-agent.test.ts` |
| BE-11 | **Truncated-tail sanitize** — drop dangling tool calls/reasoning on truncation. | `packages/server/utils/test/chat-ai-utils.test.ts` |
| BE-12 | Context compaction — collapse stale tool outputs, keep recent + schema tools. | `packages/server/utils/test/chat-ai-utils.test.ts` |
| BE-13 | **No-shrink save guard** — an aborted/empty save never wipes stored history. | `packages/server/api/test/unit/app/ee/chat/chat-rpc-handlers.test.ts` |
| BE-14 | **Run-fenced persistence** — a stale (superseded) run's write is skipped. | `chat-rpc-handlers.test.ts` |
| BE-15 | **Approval-gate idempotency** — first decision wins; duplicate resolve is ignored; pending-gate keys cleaned. | `packages/server/api/test/unit/app/ee/chat/chat-approval-gate.test.ts` *(new)* |
| BE-16 | System-prompt structure guard — named doctrines stay intact. | `packages/server/api/test/unit/app/ee/chat/system-prompt-guard.test.ts` |
| BE-17 | Stream adapter / AI-event parsing (thinking, tool calls, text chunks). | **STALE** — `app/chat/{stream-adapter,ai-event-utils,sandbox-agent}.test.ts` import the removed `src/app/chat/sandbox/*`; dead since the sandbox refactor. Re-point or delete (see below). |

## UX — front-end behavior (NOT gated this pass; tracked for awareness)

These dominate the sessions but are intentionally out of scope for the harness (decision: test
the harness, not the UI). Recorded here so the study isn't lost and a later phase can pick them up
(component tests / Playwright e2e).

| ID | Behavior | Source | Where it lives |
|---|---|---|---|
| UX-01 | Table **live-sync** — chat mutations appear in the open table without reload (idempotent-by-id deltas, insert stagger). | `23506584`, `929b2085`; `chat-realtime-table-deltas` | `packages/web/src/features/tables/hooks/use-table-realtime.ts` |
| UX-02 | Follow rows added **below the fold** (auto-scroll/indicator). | `929b2085` | table view |
| UX-03 | Context-switch marker shows **only on real navigation** (no false "Switched to…" on every send). | `65d6322a`; `chat-ambient-context` | chat panel ambient context |
| UX-04 | **First message always renders** (panel owns conversation id in state, not the URL). | `69a26fdf`; `chat-panel-identity-not-url` | chat panel |
| UX-05 | Panel **close / pop-out / resize** unified; resizer position persists across nav. | `695f6298`, `575821e0`; `chat-route-and-stage-closed` | stage/chat layout |
| UX-06 | **@-mention** dropdown theme-consistent, resolves flows/tables/apps. | `145b802a`; `chat-at-mentions` | composer |
| UX-07 | Stage **title bar / back-arrow** clarity (title always shown; back only with history). | `2dc3e500`, `bf326c21` | stage panel |
| UX-08 | **Automation celebration card** styling (single color, prominent copy). | `5b3f2ae1` | build/automation card |
| UX-09 | Streaming markdown per-word slide-up. | `chat-streaming-markdown` | assistant text rendering |
| UX-10 | Build-card grouping (absorbs build activity without jump/contamination). | `chat-build-card-grouping` | build card |

## Current state on this branch (pre-existing — not introduced by this registry)

`npm run chat:quality` runs the **alive** chat backend tests across packages. It deliberately
**excludes `packages/server/api/test/unit/app/chat/`** — those four files (`ai-event-utils`,
`sandbox-agent`, `stream-adapter`, `chat-compaction`) import `src/app/chat/sandbox/*`, which was
relocated to `src/app/ee/chat/` in the chat refactor; they collect zero tests and fail to load in
any runner. They are **dead tests to delete or re-point**, not chat-quality signal.

Among the alive tests, these currently **fail on this branch** (independent of this work — the gate
is correctly surfacing them):
- `system-prompt-guard.test.ts` — system prompt ~25.5k tokens vs the 25k ceiling (BE-16). The prompt grew past budget; trim or raise the ceiling deliberately.
- `chat-rpc-handlers.test.ts` — 2 of 6 tests fail (`updateChatProgress` writes twice / times out). Likely a real branch regression worth a look (BE-13/BE-14).

Newly added here and **green**: `chat-mcp-client.test.ts` (BE-07 auth injection, +6), `chat-approval-gate.test.ts` (BE-15, new).

## Adding to the registry
- New agent behavior → add an `AGT-*` row + a `fixtures/<id>.json` (see `fixtures/README.md`).
- New backend guarantee → add a `BE-*` row + the vitest file under one of the `chat:quality` globs.
- Keep the **Coverage** column honest: a path or `GAP`. A row with no test is a backlog item, not a guarantee.
