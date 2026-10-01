---
status: accepted
---

# Platform tiers are platform-owned and grant key access

## Decision
A **platform tier** (`platform_model_tier`) belongs to the platform, not to a key. It is an ordered list of `{configId, modelId}` entries: entry 0 is the main model, the rest are ranked fallbacks, and the entries may come from different keys. A project that uses a tier may run every entry in it, even when an entry's key is scoped away from that project. Picking one specific model still obeys the key's scope.

## Context
Admins want builders to pick "Fast" or "Expert" instead of hunting for model ids, and to move models between tiers without breaking flows. An earlier plan put a tier map inside each provider key. That couldn't express fallbacks across providers, and it tied a tier's meaning to a single key's scope.

## Why
If a tier were limited by each key's project scope, the same tier would run different models in different projects, and a fallback on a restricted key would silently vanish. Letting the tier grant access keeps its meaning the same on every surface. We rejected the per-key tier map, because moving a model would mean rewriting every key that listed it.

## Consequences
- The grant is security-sensitive. The runtime must only honour a `configId` that a live tier on the same platform contains, and never a client-sent `configId`.
- A key a live tier uses cannot be deleted, and its `modelScope` cannot drop a tier's model. `aiProviderService` refuses both.
- A deleted tier stays as a soft-deleted row with a `replacedBy` pointer, so stored refs keep resolving without rewriting any flow.
- On agent and chat runs the grant also covers the platform's **Fast** tier, because the first step runs on it. Fallback there is per step: a step that fails before sending content continues on the next candidate.
- Platform tiers are unrelated to the console **credits tiers** (`ModelTier`, `pricing.json`). They share only the word "tier".
