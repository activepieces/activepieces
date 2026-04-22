# AI Provider Migration — Project Summary

## The problem

Activepieces platform admins can migrate every flow on their platform from one AI provider or model to another (for example: "move everything from OpenAI's GPT‑4 to Anthropic's Claude"). The existing feature silently produces broken flows.

Five failure modes today:

1. **No modality guard.** The admin can mistakenly send text-generation steps to an image-generation model, or vice versa. The dialog offers every model regardless of what the step actually does. The flow looks fine until it runs and crashes.

2. **No piece-version check.** Each flow step is pinned to a specific version of the AI integration package. The list of providers that each version understands has grown over time — an older version might not know about, say, AWS Bedrock. If the admin migrates an old flow to a newer provider, the step's code has no branch for that provider and throws an error the next time the flow runs.

3. **No handling of outdated flow formats.** Flows saved in older formats can have input shapes the current code doesn't understand. The migration tool was rewriting fields without first bringing the flow up to date, leading to inconsistent results and — worse — overwriting each other in an order that left flows broken.

4. **Provider-specific settings linger.** Things like "web search domains allowed" (an Anthropic-only concept) or "image quality = HD" (only valid for certain OpenAI image models) get copied across providers verbatim. The new provider either ignores them silently or, in the worst case, rejects them at runtime.

5. **Zero visibility.** The admin clicks Migrate and finds out what happened only when flows start failing days later. There's no preview, no per-flow audit of what changed.

## What we're building

A safer, verifiable version of the same feature with four capabilities:

### Dry-check before committing

Before touching any flow, the admin can run a "dry-check" that simulates the whole migration across every flow on the platform. The result shows:

- **Clean**: flows that migrate with no side effects.
- **Upgraded**: flows whose AI integration package will be bumped to a current version (safe, empirically verified across every published version).
- **Feature-adjusted**: flows where some settings have to change (e.g. web search turned off because the new provider doesn't support it). Each row shows exactly what will change.
- **Blocked**: flows that can't migrate (e.g. their pinned package version is too old and no newer version is installed on the platform). Each row explains what's needed to unblock them.

Dry-check is recommended by default in the dialog. Once the admin reviews the results, they can click "Run for real" on the dry-check row and the migration runs for real with the same parameters, locked so they don't accidentally change the target after reviewing.

### Modality guard

A "Migrate Image Models" checkbox at the top of the dialog constrains the migration to one domain (text vs. image). The provider and model dropdowns both filter accordingly, and any provider with no models of the selected type disappears from the list. Backend enforces the same constraint server-side so no crafted request can bypass it.

### Automatic input cleanup

When a step's settings no longer apply to the new provider, the migration cleans up:

- Image-generation advanced options (quality, size, etc.) are cleared — each AI image model has its own specific set of allowed values; the admin reconfigures from defaults if they care.
- Web-search options are rebuilt to carry only the keys that work everywhere; provider-specific ones are dropped.
- If the new provider doesn't support web search at all, the whole feature is turned off on that step so the flow doesn't crash at runtime.

Every one of these changes is listed on the dry-check preview so the admin sees them before committing, and listed again in the post-migration report so they can audit what happened.

### Future-proof enforcement

Every time someone adds a new AI provider to the integration package, an automated test catches it if they forget to update the compatibility data the migration tool depends on. This prevents the feature from silently breaking again as the piece evolves.

## Scope

- **In scope:** Platform-admin AI model migration feature. Dry-check preview. Per-flow change reporting. Modality enforcement. Piece-version compatibility. Verbose results view.
- **Out of scope (follow-ups):** A "revert this migration" button (the data is already preserved to support it later), periodic cleanup of old dry-check records, OpenRouter submodel support (similar to the Cloudflare Gateway parity work we already shipped).
- **No database migration required.** Only new fields added to existing JSON storage; old records remain readable.

## Dependencies / context

A related piece of foundation work just landed: **Cloudflare AI Gateway submodel parity**. Cloudflare Gateway is a proxy — when an admin targets `cloudflare-gateway` with an `openai/gpt-4` submodel, the piece now treats it identically to direct OpenAI for feature purposes. This means migrating between direct providers and their Cloudflare-routed equivalents is no longer disruptive.

## Risks

- The compatibility data for historical AI-integration versions is hand-curated from npm history. A mistake there could mis-categorize old flows. Mitigation: automated test guarantees current-version accuracy; historical entries are few and auditable.
- Dry-check on very large platforms may take minutes. It runs as a background job (no UI timeout), but is a candidate for future progress reporting.
- Cloudflare Gateway's transparent passthrough for some features isn't formally documented. We'll validate live on a dev instance as part of rollout — if something fails there, we fall back to treating all Cloudflare targets as no-web-search.

## Rollout

- One PR on the current branch.
- Extends existing endpoint; no new routes.
- No database migration.
- Safe to ship to Community, Enterprise, and Cloud editions in a single deploy.

## What the admin experience looks like

```
Migrate Flows button
  ↓
Dialog opens in new-migration mode:
  □ Migrate Image Models
  Source provider/model: [dropdown]
  Target provider/model: [dropdown]
  ☑ Run a dry-check first (recommended)
  [Run migration]
  ↓
Dry-check runs; dialog shows spinner → preview with four buckets
  ↓
Admin reviews, closes dialog
  ↓
On the migrations table: dry-check row with [Run for real] button
  ↓
Clicking opens the same dialog, fields locked, banner saying
"This is the migration you previewed at {time}"
  ↓
Admin clicks Run migration → real migration runs
  ↓
Results table shows per-flow changes (piece upgraded, options cleared,
web-search disabled, etc.) — auditable, with links back to each flow.
```
