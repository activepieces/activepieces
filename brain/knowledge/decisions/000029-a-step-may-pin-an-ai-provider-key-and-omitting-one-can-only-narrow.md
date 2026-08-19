---
icon: 📌
status: accepted
---

# A step may pin an AI provider key, and omitting one can only narrow

## Decision

An AI step and an agent may name the exact `ai_provider` row they run on: the AI piece stores it in a
`configuration` prop beside `provider`, an agent in `AgentConfig.providerConfigId`. Every read routes
through one resolver, `resolveRowForScope({ platformId, provider, scope, configId })` — with no
`configId` it falls back to the deterministic ranking (`selected` > `except` > `all`, newest first);
with one it serves that row only after checking it belongs to the platform, matches the named
provider, and passes `rowAllowsScope` for the caller's project. Key names are unique per
`(platformId, provider)`, checked in the service.

## Context

The multi-key redesign gave a platform several keys per provider, but `listForProject` deduped them to
one entry and a step stored only an `AIProviderName`, so the builder showed a single row labelled with
the winning key's display name. An admin who configured "Anthropic key 1" and "Anthropic key 2" saw
one of them and reasonably read the other as lost; two keys both scoped to *all* projects meant the
newer one won everywhere and the older never executed.

## Why

Scoping alone cannot express "this step, that key" — it can only express "this project, that key",
and a project routinely wants a cheap key for one step and a production key for another.

The obvious risk was reopening the fail-open hole that decision
[000027](000027-ai-provider-resolution-takes-a-required-scope-and-splits-reads-by-trust-level.md)
closed, since `configId` is optional by nature. It does not, and the asymmetry is the point: a
forgotten `configId` degrades to the deterministic winner, which is by construction already eligible
for that scope, so an omission narrows-or-equals and never widens. `scope` stays required and is
still what authorizes the row. The rejected alternative was a per-key route or a flat dropdown of
every key across providers: both would have made the stored value stop being a provider name, forcing
every action that branches on `provider` (web search, image capability, `getEffectiveProviderAndModel`)
to parse it — the every-call-site-must-remember shape that caused the original P1s.

Names are constrained because a picker showing two rows called "Anthropic key" is unusable. The check
lives in the service rather than a unique index: an admin racing themselves is not a real threat, and
the index costs a migration and a Postgres error to map back to a form message. Duplicate
*credentials* stay legal — one secret with two allow-lists is a supported setup, and the random-IV
encryption makes duplicates undetectable anyway.

## Consequences

`ProjectAIProvider` now carries `keys: [{ id, name }]` for the project-facing list, and its `name` is
the vendor label (`aiProviders[provider].name`) rather than a key's display name; the list itself
stays deduped, so `ap_list_ai_models` and the agent selector are unaffected. `GetProviderConfigResponse`
returns `configId`, which the chat worker echoes back on piece and knowledge-base tool calls, so every
call in one turn runs on the same key instead of re-ranking mid-run.

A pinned key becomes a hard dependency: delete it, or scope its project away, and the step fails at run
time rather than sliding to another key. That is the intended trade for an explicit choice, but it is
the reason the first cut avoided pinning.
