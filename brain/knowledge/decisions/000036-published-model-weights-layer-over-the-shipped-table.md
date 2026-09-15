---
icon: 🧱
status: accepted
---

# Published model weights layer over the shipped table, they do not replace it

## Decision

`modelWeights` in `ai/pricing.json` is applied **on top of** `MANAGED_MODEL_WEIGHTS` from the
release, not instead of it:

```ts
modelWeights: { ...MANAGED_MODEL_WEIGHTS, ...parsed.modelWeights }
```

A model the published file leaves out keeps the price we shipped. The console can change any
price and add any model, but it cannot remove a price.

## Context

The first version replaced the whole table, and guarded against a half-written file by counting
keys: reject anything below 80% of the shipped count. The guard checked the wrong thing. It only
compared sizes, so a file that dropped every real model and added 174 new ones passed.

That mattered because this branch also raised the unpriced rate from 2 credits to 100, so a model
that falls through is now expensive on purpose. `google/gemini-2.5-flash-lite` is priced at 1.
Dropping it from the file charged it 100 — a 100x overcharge, from a publish that looked fine.

## Why

Layering removes the failure instead of detecting it. There is no threshold to tune and no way for
a missing entry to change a price, so the guard was deleted rather than fixed.

Rejected: check the overlap with the shipped table instead of the count. It is a real improvement
but still lets a fifth of the models silently fall to the unpriced rate, and it keeps a magic ratio
that nobody can justify.

The cost is that a weight can never be deleted through the console. That is not a real loss:
deleting a weight means "charge this model the unpriced rate", which nobody publishes on purpose.
If it is ever needed it wants an explicit `removedModelIds` field, not a missing key.

## Consequences

- The table shipped in the release is a live floor, not dead weight. Keep pricing new models there
  as well as in the console, or they fall to the unpriced rate until someone publishes them.
- Tiers do **not** layer. `tiers` and `defaultTierId` are replaced wholesale, because a tier list is
  an ordered set the console owns, and merging one would resurrect a tier that was deliberately
  removed. Only `modelWeights` merges.
- A publish that truncates the model list is now harmless and therefore silent. The console's own
  history prefix is the only place that shows it happened.
