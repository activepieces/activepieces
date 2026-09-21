---
title: AI router conditions run on an instance key and bill nobody
icon: 🔀
status: accepted
---

# AI router conditions run on an instance key and bill nobody

## Decision

The `AI_MATCHES` router condition calls Jev through **one Vercel AI Gateway key held by the
instance** (`AP_AI_GATEWAY_API_KEY`). It does not read the project's AI providers, does not consume
an AI credit, and has no provider or model picker in the builder. When the key is unset, the flag
`AI_ROUTER_ENABLED` is false and the operator is absent from the condition dropdown.

## Context

Every other AI surface in the product resolves a provider: the managed `ACTIVEPIECES` key billed in
credits, or the customer's own key billed one flat credit. The router condition could have followed
either. It does neither.

## Why

The price is what makes this defensible. Jev costs $0.042 per 1M input tokens with free output, and a
condition sends one sentence. At that rate a metering pipeline, a credit balance check and a provider
picker all cost more to build and more to run than the inference they would be accounting for.

It is also the only shape that keeps the UX honest. A condition is not a step — it sits inside the
router's hand-rolled Zod form, which cannot render `aiProps`. Reimplementing the provider picker there
is about a day of work for a choice nobody would change, and every field added to a condition row is
paid for by every user reading that row. What is left is a question and a confidence level, which is
the whole feature.

The rejected alternative was resolving the project's own provider. It turns a one-line condition into a
setup task, makes the feature invisible until someone connects a key, and is the exact shape
`.claude/rules/self-hosting.md` warns about.

The cost we accept: an instance pays for its users' conditions, and a flow that hammers a router pays
for it in inference we do not meter. Bounded by a 10 s abort and by the price.

## Consequences

The gateway key is a single point of failure for the operator. A failed or timed-out call **fails the
step** — it never quietly takes the fallback branch, because routing a refund down the wrong branch
because a model timed out is a correctness bug that looks like normal operation.

Because nothing is metered, there is no usage record to reason about later. If cost ever becomes
visible, metering has to be added before the behaviour can change, and flows will already depend on
conditions being free.

Self-hosters who set no key lose nothing and see nothing — that is the zero-setup rule holding, and it
is why the flag gates the dropdown rather than the endpoint alone.
