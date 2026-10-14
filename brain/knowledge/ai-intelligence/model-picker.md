---
icon: 🎛️
---
# Model Picker

The one picker a builder uses to choose what an agent, chat or AI step runs on. It lists what the current project may use, in three sections. Hovering a row opens a side card with that model's data, to the left of the list at the row's height. The card stays open while the pointer moves onto it.

**ModelChoice** — the stored pick: `{ type: 'tier', tierId }` or `{ type: 'model', provider, providerConfigId, modelId }`. A credits pick is a `model` on the managed Activepieces key with `modelId` set to the credits tier id, so there are two kinds, not three.
- *Avoid:* "credits choice" as a third kind.

**Model options** — `GET /v1/ai-providers/model-options?projectId&surface` (`aiModelOptionsService`). The server builds the whole list so the scope rules live in one place:
- **Your tiers:** a tier shows only when its main entry runs in the project. Fallbacks that can't run there are dropped.
- **Credits tiers:** shown whenever the managed provider is visible.
- **Your keys:** one group per key that serves the project, empty when the admin hides specific models.

On `agent` and `chat` a tier whose main model can't call tools is hidden, and so is a key model without tool calling. On `chat`, keys with a curated list offer only that list.

**Default choice** — `aiModelOptionsUtils.defaultChoice`, tried in this order:
1. The Default tier.
2. On chat only, the Default AI key's first model.
3. The credits default.
4. The first tier.
5. The first key model.

## Gotchas
- An agent model with no `providerConfigId` follows whichever key ranks first (`findEligibleRow` → `rankRows`), so adding a key could silently move it. Agent create and save now pin the key (`withDefaultModel` takes the chat key's id, `withPinnedKey` stores the key a run would use today). Agents saved before this stay unpinned until their next save. The default model follows the pinned chat key's model scope and typed-in list, or the run would reject it. Moving an agent keeps its key only if the target project can use it; otherwise it re-pins to the key a run there would pick (`findRunKeyId` with `preferredConfigId`).
- A stored model pick is matched by its `providerConfigId` only. The "any key of this provider with this model" fallback is for old agent rows saved without a key id (`''`). Otherwise a deleted key would look selected while the run still fails on it.
- cmdk's `CommandItem` replaces any `onPointerMove` you pass it with its own hover-select. The picker reads hover on `CommandList` instead, from the closest `[cmdk-item]`'s `data-value`. Its `onValueChange` also fires when the list opens, because cmdk highlights the first row. So the detail card only follows `onValueChange` after an arrow key has been pressed.
- The side card hides any row it has no data for. Catalog metadata comes from the CDN `model-catalog.json`, and its publish has failed before, so expect gaps. The lookup is by exact id and is all-or-nothing. A real OpenAI key had 50 of 88 models with no data: 24 dated snapshots (`gpt-5.5-2026-04-23`, where the catalog has only `gpt-5.5`), 6 that exist only under `openrouter` as `openai/<id>`, and 20 search, research, alias or legacy ids.
- The admin Tiers page pickers (`AdminModelPicker`) use the same `ModelPickerPopover` and `ModelDetailCard`, so the cards look the same on both pages. Picker dropdown rows show no capability icons; the hover card shows them. The Tiers page model rows (`ModelDetailRow`) draw four fixed slots through `ModelCapabilityIcons`: tool calling, reasoning, vision, web search. An unsupported capability leaves an empty slot, so the columns stay lined up.
- All four capabilities always show, everywhere. In the card, an available one is a green pill and anything else is struck out. On Tiers page rows, unavailable icons are dimmed. "Not available" covers two cases. Tool calling, reasoning and vision come from the catalog, per model, so a model the catalog misses has them all struck. Web search comes from `AI_PROVIDER_CAPABILITIES`, per provider, and is struck when we haven't wired that provider's search (OpenAI today), even if the model itself can search.
- The hover card opens to the left of the list. It flips to the right when the popover sits too close to the left edge (Add fallback on a tier opens there).
- A stored deleted tier shows its live replacement ("Moved"), because the runtime follows `replacedBy` too. The picker sends its stored `tierId` and `movedTiers` follows only that chain; without a `tierId` it is empty.
- On chat, a key with a typed-in model list (Vertex, Custom) offers exactly that list, not the curated list. The chat runner (`agentModelResolution`) picks only from the manual list, so a curated model outside it would be silently swapped.
- A stored model that the admin hid with the specific-models toggle shows "Hidden by admin". It still runs, because the toggle is not enforced at run time.
- `surface='flow'` turns off the tool-calling filter (`callsTools` in `aiModelOptionsService`), so it is only for text AI steps. The Run Agent step needs tools, so it uses `surface='agent'`.
- The Run Agent step does not go through `/v1/ai/execute`. Its piece posts to `/v1/agents/runs`, and the agent runtime resolves the model (`getAgentConfig` → `agentModelTier.resolveRun`). Steps pin an exact piece version, so a field the piece learns to forward reaches only steps on that version or newer.
- The Run Agent step stores a tier as `{ modelTierId }` and only piece-ai 0.14.1+ forwards it. On an older step `AgentModelField` hides tiers and shows a one-line hint to update the step. Downgrading a step below 0.14.1 keeps the stored tier, and the old piece drops it, so that run uses the Default AI key.
- A flow step has no server create hook, so `AgentModelField` writes `defaultChoice` once when the stored value is empty and the step is editable. On an old step it writes the credits default or the first key model instead of a tier.
- **The knowledge-base check asks the server, it never guesses.** The KB section and the agent panel's embedding note read `GET /v1/knowledge-base/files/embedding-source` (`useKnowledgeBaseEmbeddingSource`), which runs `knowledgeBaseService.embeddingSourceFor`, the same resolver uploads use: the Embeddings capability pick (key + model), else the Default AI key with its provider's default embedding model, else null. A Default AI key that can't embed (Anthropic) returns null, so the web shows the "no key can index files" note instead of an upload that fails. Builders can't read `/v1/ai-tools` (admin only), which is why this route exists.
- **Chat uses the same `ModelPicker` as agents, as `variant="pill"`.** The chat keeps the raw pick (`modelTierId` / `providerConfigId` + `modelName`) from the conversation and turns it into a `ModelChoice` only where the options are loaded (`chatUtils.choiceOf`). A pick on a deleted key keeps its id with a placeholder provider, so the picker shows Unavailable instead of silently showing the default. A new chat sends what the pill shows; agent chats send no pick (the agent's model wins).
- An older managed pick can store a concrete id (`anthropic/claude-sonnet-4.6`) instead of a credits tier id. It still runs while the server's managed list has it (`managedChatModelIds()` plus the published credits tiers' models), so the picker checks that same list: a listed id shows as a Credits pick with its raw id, a retired one as Unavailable.
- **Don't use `defaultChoice` on a hot run path.** `aiModelOptionsService.list` fetches every key's model list and skips a key whose list fails, so a flaky provider API (or a fake test key) can leave `defaultChoice` null, or point it somewhere else. The chat run path (`agentChatModel.defaultPick`) checks the Default tier and the Default AI key without listing models, and only falls back to `list` when neither exists.
- The picker never writes a default by itself. An agent gets its default model from the server when it is created. An unknown pick shows an amber "Unavailable" and is never silently swapped (S11).

## Key files
- `packages/web/src/features/agents/ai-model/`: `ModelPicker`, `ModelPickerPopover`, `ModelDetailCard`
- `packages/server/api/src/app/ai/`: `aiModelOptionsService`
- `packages/web/src/app/builder/step-settings/agent-settings/`: `AgentModelField`, `agentModelUtils` (the Run Agent step)
