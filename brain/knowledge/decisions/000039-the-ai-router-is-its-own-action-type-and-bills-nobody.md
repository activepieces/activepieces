---
title: The AI router is its own action type and bills nobody
icon: 🔀
status: accepted
---

# The AI router is its own action type and bills nobody

## Decision

**AI Router is a real `FlowActionType.AI_ROUTER`**, not a Router mode and not a piece action. It asks
one question at the root and each branch is one possible answer, inverting the Router's one-condition-
tree-per-branch model. It calls Jev through **one Vercel AI Gateway key held by the instance**
(`AP_AI_GATEWAY_API_KEY`) over `safeHttp`, reads no project AI provider, consumes no credit, and has
no provider or model picker. Unset the key and `ApFlagId.AI_ROUTER_ENABLED` is false and the step is
absent from the picker.

## Context

The capability first shipped as `AI_MATCHES`, a 23rd entry in the Router's condition-operator
dropdown (PR #15666, parked unmerged). It worked and nobody could find it — there is nothing to
market from inside a `<SelectItem>`, and a condition row is the wrong shape for the decision anyway.

A piece action was the cheap option and is not buildable: a piece cannot own child steps, so "AI
Router as a piece" is Classify Text followed by a normal Router.

## Why

**Separate type, for the product.** The requirement was discoverability, and a distinct card, icon,
settings panel and docs page is what delivers it. The cost is real — `FlowActionType.ROUTER` appears
in 31 source files — but most sites widen to `flowStructureUtil.isBranchedAction` in one line, and
the engine's branch-walking loop was extracted to `executeBranches` so both routers share it.

**One `choice` question, not one `boolean` per branch.** Measured live against Jev on 2026-09-21:
three sequential boolean calls took **1699 ms / 871 input tokens**; the same decision as one choice
question took **385 ms / 367 tokens**. The choice answer is also guaranteed to be one of the option
names, so "the model picked a branch that does not exist" is structurally impossible.

**The fallback branch is sent to the model as a real named option.** This is the non-obvious part.
Without it, the input `"hi"` routed to `Sales` at probability **0.87** — confidently wrong, and past
any sane threshold. With an explicit `Otherwise` criterion, `"hi"` and `"what is the weather today"`
both go to Otherwise at **1.00** while a clear billing message still goes to Billing at 1.00. A
confidence floor is kept as a second, independent net, but it is not the mechanism.

**No metering.** Jev costs $0.042 per 1M input tokens with free output and a routing decision sends
one sentence. A credit check and a usage pipeline cost more to build and run than the inference they
would account for. Resolving the project's own provider was the rejected alternative: it turns a
two-field step into a setup task and is the shape `.claude/rules/self-hosting.md` warns about.

## Consequences

The gateway key is a single point of failure for the step, and an instance pays for its users'
routing. Bounded by a 10 s abort and by the price. Nothing is metered, so there is no usage record to
reason about later — if cost becomes visible, metering must be added *before* behaviour can change,
and flows will already depend on routing being free.

A failed or timed-out call **fails the step**. It never quietly takes the fallback, because routing a
refund down the wrong branch because a model timed out is a correctness bug that looks like normal
operation.

The step started with **no `executionType`**, on the reasoning that a choice answer names exactly one
branch so all-match had no meaning. That held only while the step asked one `choice` question. It now
carries `matchMode`: `BEST_MATCH` asks one `choice` question and exactly one route runs, while
`ALL_MATCHES` asks one `boolean` question per route — in a single request, since the gateway's
`questions` field is a record — and every affirmed route runs. The fallback rule mirrors the Router's
exactly: it runs iff no other route did.

The two modes differ in a way that is easy to get wrong: **`ALL_MATCHES` never sends the fallback to
the model.** There is no forced choice to decline from, so booleans can all be false on their own and
the fallback is computed locally. The measured "give the model an explicit `Otherwise` criterion or
`hi` routes to Sales at 0.87" finding therefore applies to `BEST_MATCH` only. `ALL_MATCHES` also
costs one question per route instead of one per step, which is the honest trade for fan-out.

`AI_MATCHES` (PR #15666) is parked. If it ever merges, the product carries two AI branching concepts
and that needs its own call.

**The AI router will never absorb the Router, and the reason is worth knowing before someone
proposes it.** The two differ in *evaluator*, not interface: determinism, zero cost and zero latency
are properties of not calling a model. You can get "same answer usually"; you cannot get "same answer
forever", because the model version lives outside the flow and a vendor upgrade can re-route a
historical case. Temperature, seeds and caching do not change that. So anything a human must defend
years later — compliance gates, billing tiers, approval thresholds — stays on the Router permanently.

The gaps that *are* reachable, and how, so the design does not get re-derived: **fan-out** by a
match-mode toggle (one `choice` question → one route, N `boolean` questions → every route that
applies, which is the Router's first-match/all-match concept and the cheapest of the three);
**facts** (thresholds, exists, two-value comparisons) by an optional one-line deterministic *guard*
per route, evaluated first so guarded-out routes never reach the criteria map; **multi-dimensional
routing** by asking several questions in one call and matching routes on combinations, which the
gateway's plural `questions` record already supports and which the Router cannot do on meaning at
all. The guiding line is that the model turns unbounded text into a small enumerated value and
everything after that is data. The standing risk on guards is that a nested condition builder inside
a route rebuilds the Router twice and loses the pitch — one guard, one line, no AND/OR groups.

The MCP flow-building tools still only understand `ROUTER`. They degrade rather than break —
`ap_update_branch` reports the step is not a router, `ap_flow_structure` omits branch detail — because
letting the agent create an AI router without settings support would let it build broken steps.

**Jev is only reachable through the Vercel AI Gateway, so the gateway key is not swappable for the OpenRouter key the platform already holds.** Checked against OpenRouter's live catalog on 2026-09-22: 444 models, no Jev, no evaluation-model endpoint. Moving would be a model replacement confined to `ai-router.service.ts` (the engine, the web and the `{ matched, probabilities }` contract stay), and the cost is the probabilities: a chat model's self-reported confidence is uncalibrated, so the honest substitute is one-token answers read through `logprobs`, which only 158 of the 444 models expose (`openai/gpt-4o-mini` does; Gemini flash-lite and gpt-5-mini do not) and which OpenRouter's provider routing can silently drop unless `require_parameters` is pinned. The "hi" → Otherwise result above is a Jev measurement and would need re-taking on any replacement.
