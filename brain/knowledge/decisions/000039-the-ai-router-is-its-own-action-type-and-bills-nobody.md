---
title: The AI router is its own action type and runs as a worker AI step
icon: 🔀
status: accepted
---

# The AI router is its own action type and runs as a worker AI step

## Decision

**AI Router is a real `FlowActionType.AI_ROUTER`**, not a Router mode and not a piece action. It asks
one question at the root and each branch is one possible answer, inverting the Router's one-condition-
tree-per-branch model. It calls Jev (`typesafe/jev-1.13`) through **OpenRouter's Decisions API on the
platform's own OpenRouter key**, as a `ROUTE` action of the worker's `EXECUTE_AI` job: the engine posts
to `/v1/engine/ai-router`, the API picks the provider and gates credits, the worker makes the call and
bills it. The key is the managed Activepieces provider where credits are on, else the admin's own
OpenRouter row; the step has no provider or model picker and appears in the picker only when the
project's provider list contains one of the two. Billing is decision 000037 unchanged: observed
`usage.cost` on the managed key, one fixed credit on an own key.

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

**Billed like any AI step, through the worker chokepoint.** The first cut billed nobody and called a
Vercel AI Gateway from the API process with an instance-wide key, on the reasoning that Jev costs
$0.042 per 1M input tokens and a usage pipeline would cost more than the inference. Its own
Consequences warned that metering had to land before flows depended on free routing, and the PR was
unmerged, so it did. Running the call as an `EXECUTE_AI` job reuses the pipeline decisions 000016 and
000037 already built — provider resolution, `assertCreditsAndAppSumoNotExceeded` before the job, cost
reported from the worker over RPC — instead of a second one beside it. The step still asks nothing of
the user: the provider is picked server-side from `listForProject`, which is also what the picker
reads, so server and picker agree by construction.

## Consequences

A routing decision costs the platform what it costs us on the managed key (about 0.02 to 0.08
credit) and one credit on an own key; a production run through one router is therefore about one
credit plus a fraction. The engine waits 30 s, the API façade 25 s, the worker's HTTP call 8 s, so the
readable failure text always beats a bare engine timeout. Community Edition has no OpenRouter key
unless the admin adds one, so the step is hidden there by default — the price of dropping the
instance-wide env var. OpenRouter's Decisions endpoint is alpha; its wire format lives in one worker
file (`route.ts`) with a unit test per answer shape.

A failed or timed-out call **fails the step**. It never quietly takes the fallback, because routing a
refund down the wrong branch because a model timed out is a correctness bug that looks like normal
operation.

The step started with **no `executionType`**, on the reasoning that a choice answer names exactly one
branch so all-match had no meaning. That held only while the step asked one `choice` question. It now
carries `matchMode`: `BEST_MATCH` asks one `choice` question and exactly one route runs, while
`ALL_MATCHES` asks one `noul` question per route — in a single request, since Jev's
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
routing** by asking several questions in one call and matching routes on combinations, which Jev's
plural `questions` record already supports and which the Router cannot do on meaning at
all. The guiding line is that the model turns unbounded text into a small enumerated value and
everything after that is data. The standing risk on guards is that a nested condition builder inside
a route rebuilds the Router twice and loses the pitch — one guard, one line, no AND/OR groups.

The MCP flow-building tools resolve both router kinds for structure, validation and delete.
`ap_add_branch` and `ap_update_branch` refuse an AI router with a message, and `ap_add_step` cannot
create one, because letting the agent build one without settings support would let it build broken
steps. Those three need a per-type body.

**Jev is on OpenRouter, but not where a catalog scan looks.** `GET /api/v1/models` lists text-producing models only; Jev's output modality is `decisions`, so it is absent there and lives at `POST https://openrouter.ai/api/alpha/decisions` as model `typesafe/jev-1.13` (`jev-latest` 404s, so pin the version). Same price as the gateway, $0.042/M in and free out, 32k context. The wire format, confirmed against OpenRouter's own Jev tutorial: body `{ model, state, questions }` with `state` an object (we send `{ text }`), a yes/no question is `type: "noul"` and its answer is `{ type: "noul", noul }` where `noul` is P(true) — no `answer`, no `probability` field — a choice answer is `{ choice, confidence, probabilities }`, and `usage` carries `input_tokens`, `output_tokens` and `cost` in dollars by default. A first pass of this note claimed OpenRouter had no Jev, from scanning the text-model catalog only.

**Decided 2026-09-23: run in the worker on OpenRouter, reversing the previous day's "stay on the gateway".** That call rested on a false premise: it said the only OpenRouter key the instance held was the management key, which cannot call a model. The management key is indeed inference-blind, but `enrichWithKeysIfNeeded` uses it to mint a real inference key per platform for the managed Activepieces provider, and any admin who added OpenRouter under AI providers holds one too. So the deployment already had a callable key, the gateway added a second vendor for nothing, and the worker pipeline could bill the call for free. The move also improves `.claude/rules/self-hosting.md` compliance: one env var fewer, and the key it reuses is one the deployment already manages.
