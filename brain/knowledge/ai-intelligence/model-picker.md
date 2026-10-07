---
icon: 🎛️
---
# Model Picker

The one picker a builder uses to choose what an agent, chat or AI step runs on. It lists what the current project may use, in three sections, and shows a side card with each model's data.

**ModelChoice** — the stored pick: `{ type: 'tier', tierId }` or `{ type: 'model', provider, providerConfigId, modelId }`. A credits pick is a `model` on the managed Activepieces key with `modelId` set to the credits tier id, so there are two kinds, not three.
- *Avoid:* "credits choice" as a third kind.

**Model options** — `GET /v1/ai-providers/model-options?projectId&surface` (`aiModelOptionsService`). The server builds the whole list so the scope rules live in one place:
- **Your tiers:** a tier shows only when its main entry runs in the project. Fallbacks that can't run there are dropped.
- **Credits:** shown whenever the managed provider is visible.
- **Your keys:** one group per key that serves the project, empty when the admin hides specific models.

On `agent` and `chat` a tier whose main model can't call tools is hidden, and so is a key model without tool calling. On `chat`, keys with a curated list offer only that list.

**Default choice** — `aiModelOptionsUtils.defaultChoice`, tried in this order:
1. The Default tier.
2. On chat only, the Default AI key's first model.
3. The credits default.
4. The first tier.
5. The first key model.

**Cost bar** — five fixed buckets on the blended `(input + output) / 2` $ per 1M tokens: under 0.5, 2, 8 and 25, then 25 and up. The same model gets the same bar everywhere. Credits rows show the bar but no $ figures.

**Tier colour** — `swatchUtils.varsForSeed({ seed: tierId })`, the shared 12-hue swatch palette. There is no column for it.

## Gotchas
- The side card hides any row it has no data for. Catalog metadata comes from the CDN `model-catalog.json`, and its publish has failed before, so expect gaps.
- A stored deleted tier shows its live replacement ("Moved"), because the runtime follows `replacedBy` too (`movedTiers` in the response).
- A stored model that the admin hid with the specific-models toggle shows "Hidden by admin". It still runs, because the toggle is not enforced at run time.
- The picker never writes a default by itself. An agent gets its default model from the server when it is created. An unknown pick shows an amber "Unavailable" and is never silently swapped (S11).

## Key files
- `packages/web/src/features/agents/ai-model/`: `ModelPicker`, `ModelPickerPopover`, `ModelDetailCard`
- `packages/server/api/src/app/ai/`: `aiModelOptionsService`
