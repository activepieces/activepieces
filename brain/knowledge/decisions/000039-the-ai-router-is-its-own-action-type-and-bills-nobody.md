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

The step has **no `executionType`**: a choice answer names exactly one branch, so all-match has no
meaning. That is a simplification the AI router earns and the Router cannot have.

`AI_MATCHES` (PR #15666) is parked. If it ever merges, the product carries two AI branching concepts
and that needs its own call.

The MCP flow-building tools still only understand `ROUTER`. They degrade rather than break —
`ap_update_branch` reports the step is not a router, `ap_flow_structure` omits branch detail — because
letting the agent create an AI router without settings support would let it build broken steps.
