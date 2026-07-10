# AI Credit Usage (per-project attribution)

## Summary
Attributes AI credit consumption to the project that generated it, so platform admins can do showback/chargeback across teams (GIT-1523). Billing stays pooled at the platform level (OpenRouter meters the platform's managed key); this feature is visibility only. The AI piece reports the exact OpenRouter cost of every managed-provider call to the API server, which persists day-bucketed credit totals per (platform, project, provider, model) and exposes a per-project aggregation on the platform billing page and via API for embed hosts.

## How attribution works
1. `createAIModel` in the AI piece enables OpenRouter usage accounting (`usage: { include: true }`) for the ACTIVEPIECES provider only and wraps the chat model with an AI-SDK middleware.
2. The middleware reads `providerMetadata.openrouter.usage.cost` (USD) from each generate call or from the stream's `finish` part, then POSTs `{provider, model, cost}` to `POST /v1/ai-credit-usage` with the engine token. Errors are swallowed so reporting can never fail an AI step; the report is awaited (in the stream case inside the transform's `flush`) so it is not lost when the run ends.
3. The server derives `projectId`/`platformId` from the engine principal (a project can only attribute usage to itself), converts cost to credits (× `AI_CREDITS_PER_DOLLAR` = 1000), and upserts into the day bucket: an `orIgnore` insert of a zero row followed by an atomic `increment` (race-safe on both postgres and sqlite without dialect-specific SQL). Day bucketing keeps growth slow (one row per project × provider × model × day); per-run granularity is out of scope (tracked as GIT-1557).
4. `GET /v1/ai-credit-usage` returns `ProjectAiCreditUsage[]` (soft-deleted projects included via `withDeleted()` so the per-project sum keeps reconciling with the platform total) (total + current calendar month UTC, matching OpenRouter's `usage_monthly` window), sorted by credits desc.

## Known gaps (accepted)
- Embeddings (knowledge base) and server-side chat AI calls do not flow through the piece's chat model and are not attributed.
- A stream cancelled mid-generation (user stops an agent run) never reaches the `finish` part, so that call's cost is billed by OpenRouter but not attributed; the table can undercount vs the platform total.
- The report POST is awaited with a 5s timeout, so a degraded API server adds up to 5s latency per managed AI call; the timeout caps it.
- BYO providers (OpenRouter/OpenAI/... with the customer's own key) are not metered — they do not consume AP AI credits.
- The legacy `ai_usage` table (dropped on postgres by `DropLegacyTables`) is dropped on sqlite by the dedicated `DropLegacyAiUsageSqlite` migration shipped alongside this feature.

## Key Files
- `packages/pieces/community/ai/src/lib/common/ai-sdk.ts` — usage-reporting middleware (`createCreditUsageReportingMiddleware`)
- `packages/server/api/src/app/ai/ai-credit-usage-entity.ts` — `ai_credit_usage` table (unique on platformId, projectId, provider, model, day)
- `packages/server/api/src/app/ai/ai-credit-usage-service.ts` — record (upsert increment) + list (per-project SUM)
- `packages/server/api/src/app/ai/ai-credit-usage-controller.ts` — `POST /v1/ai-credit-usage` (engine), `GET /v1/ai-credit-usage` (platform admin USER + SERVICE)
- `packages/core/shared/src/lib/management/ai-credit-usage/index.ts` — shared schemas + `AI_CREDITS_PER_DOLLAR`
- `packages/web/src/features/billing/components/ai-credits/ai-credit-usage-by-project.tsx` — billing page table (hidden while empty)
- `packages/server/api/test/integration/{ce,cloud}/ai-credit-usage/` — API tests

## Edition Availability
Module registered in all editions (common section of `app.ts`, next to `aiProviderModule`); data only accrues where the ACTIVEPIECES managed provider exists (`aiCreditsEnabled`, i.e. `AP_OPENROUTER_PROVISION_KEY` set — EE/Cloud in practice). The billing page table renders only when usage rows exist.

## Domain Terms
- **AI Credit Usage**: day-bucketed, per-project attribution of AI Credits (see [AI & Intelligence context](../contexts/ai/CONTEXT.md)).
- Related: [ai-providers.md](./ai-providers.md) (credit system, managed provider), [analytics.md](./analytics.md) (separate report, no AI dimension), flow-run `ai-usage-tracker` (PostHog telemetry, counts only).
