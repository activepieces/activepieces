---
icon: 🧠
---

# AI Providers

Lets platform admins configure one or more LLM backends for AI pieces in flows. Also auto-provisions an "Activepieces" provider (backed by OpenRouter) whose credit balance and auto-top-up are metered by Autumn billing. EE/Cloud only (not registered in CE).

### Entities & services
- **AIProvider** — platform-scoped: `displayName`, `platformId` (unique with `provider`), `provider` (AIProviderName enum), `auth` (EncryptedObject, AES-256 at rest), `config` (JSON), `enabledForChat`.
- Backend under `packages/server/api/src/app/ai/`; shared schemas in `core/shared/.../ai-providers/`.
- Supported providers (10): `openai`, `anthropic`, `google`, `azure`, `openrouter`, `bedrock`, `mistral`, `cloudflare-gateway`, `custom` (OpenAI-compatible, e.g. Ollama/LM Studio), `activepieces` (auto-provisioned via OpenRouter).

### How it works
- `GET /` list (auto-creates ACTIVEPIECES when `aiCreditsEnabled`); `GET /:provider/config` returns decrypted auth (engine-only); `GET /:provider/models` (cached); `POST /` create (validates creds first); `POST /:id` update; `DELETE /:id`.
- For ACTIVEPIECES, update is blocked by an early return (only enabling `enabledForChat` is allowed); deletion is allowed and self-healing — `listProviders` recreates the managed row.
- Engine integration: AI pieces call `GET /v1/ai-providers/{provider}/config` on **every AI action execution** (no per-run caching), authorized by the engine token.
- For the managed ACTIVEPIECES provider that config route is also the **credit gate**: `assertCreditsAndAppSumoNotExceeded` (`platform/billing-provider.ts`) throws `QUOTA_EXCEEDED` when the Autumn credit or AppSumo balance is blocked — fires per AI call, but usage is only metered post-run, so in-flight spend is invisible to it. See decision 000016 (`brain/decisions/000016-managed-ai-metering-moves-to-centralized-worker-execution.md`).
- Activepieces provisioning: `getOrCreateActivePiecesProviderAuthConfig()` → `enrichWithKeysIfNeeded()` mints an OpenRouter key. No system job is scheduled — renewal/top-up is driven by Autumn (`autoTopUps` in `autumn-billing.ts`), not Stripe.

### AI Credits (Autumn-metered)
- Rate: 1000 credits = $1 USD; OpenRouter meters usage per API key; usage cached 180s.
- New managed keys are minted with a hard spend guardrail of **$500/month** (`MANAGED_OPENROUTER_KEY_MONTHLY_LIMIT_USD` in `ai-provider-service.ts`, `limit_reset: 'monthly'`) — a runaway-cost ceiling independent of the Autumn credit balance. Keys minted before the 2026-07 change carry $1000/monthly from a one-off OpenRouter backfill.
- There is no monthly credit-reset job and no direct Stripe invoicing; the only "monthly" mechanism is the key's `limit_reset`.
- Model lists are cached in memory, cleared daily at midnight via cron.

### Provider visibility
- `isActivepiecesAiProviderHidden` hides the managed provider when the `aiCreditsEnabled` flag is off (`OPENROUTER_PROVISION_KEY` unset — typical self-hosted) or when `shouldHideActivepiecesAiProvider` returns true, which is gated only on `plan.embeddingEnabled`.
- Hidden means treated as absent everywhere: `listProviders()` omits the row and `getChatProvider()`/`getChatProviderName()` return null (`findAvailableChatProviderRow`). This keeps a stale `enabledForChat` (e.g. from the 0.82.1 migration) from pinning chat to a provider that 402s with no top-up path (GIT-1620).

### Gotchas
- ACTIVEPIECES auto-provision needs `OPENROUTER_PROVISION_KEY` env var set AND `aiCreditsEnabled` true.
- **Chat model tiers are Activepieces-only.** `ACTIVEPIECES_CHAT_TIERS` (`fast`/`smart`/`premium`, shown as Fast/Expert/Heavy) hold OpenRouter-shaped Anthropic ids, so they only mean anything for the ACTIVEPIECES and OPENROUTER chat providers. Any provider that declares `ALLOWED_CHAT_MODELS_BY_PROVIDER` (openai, anthropic, google) picks a real model id from that list instead. Naively stripping the tier's vendor prefix for every provider is what once sent `claude-haiku-4-5` to OpenAI and broke every message.
- **Read the chat model list through `aiProviderUtils.getCuratedChatModels({ provider })`.** It is the one accessor the server resolver (`chatHelpers.resolveModelIdForProvider`) and the chat dropdown share, so the two cannot drift; it returns `{ id, label }` or `undefined` — never an empty list, so callers may treat a result as non-empty. Labels come from the hardcoded `CHAT_MODEL_LABELS` (falling back to the id) rather than `AIProviderModel.name`, because the live `listModels` response cannot supply one for every provider: anthropic returns `display_name` and google `displayName`, but OpenAI's `/v1/models` returns ids only.
- **`conversation.modelName` carries either a tier id or a real model id** — it is a free string with no discriminator. A legacy tier id resolves to the tier's equivalent model when the provider ships it, else the provider's first curated model, so old conversations keep working after a provider switch. Note `premium` maps to opus 4.8, which the native anthropic list does not carry, so a legacy `premium` on anthropic lands on Sonnet.
- Chat-provider resolution is **first `enabledForChat` row wins**, *not* "prefer ACTIVEPIECES". All three branches of `findAvailableChatProviderRow` reduce to that: when the managed provider is visible the function returns `chatProviders[0]` whatever it is, so a platform with `[openai, activepieces]` both chat-enabled resolves to **openai**. The client mirror is `aiProviderQueries.useChatProvider()` (`providers.find((p) => p.enabledForChat)`) — always read the resolved chat provider through it rather than re-deriving the rule inline. Both sides lean on an unordered `findBy()`: there is no `ORDER BY`, so "first" is not guaranteed stable when several providers are chat-enabled.
- `aiProviderService.listProviders` is **not a pure read**: it inserts the ACTIVEPIECES provider row when `aiCreditsEnabled && !activepiecesExists`. A `GET /v1/ai-providers` can therefore create a row. It already applies the hidden-provider filter (`plan.embeddingEnabled` hides the managed provider), which is why the client can trust its output without re-checking flags. It is `publicPlatform([USER, ENGINE])` — any authenticated user may list; only create/update/delete are `platformAdminOnly`.
- Managed-chat credit cost per turn is `tier.creditWeight + billableToolCalls` (`fast` 2 / `smart` 10 / `premium` 20, from `ACTIVEPIECES_CHAT_TIERS`), and BYOK collapses the weight to `CHAT_BYOK_CREDIT_WEIGHT` (1) regardless of tier — so never show tier weights to a BYOK platform. `CHAT_BYOK_CREDIT_WEIGHT` / `CHAT_CREDITS_PER_TOOL_CALL` live in `@activepieces/shared` so the billed number and the number shown in the model picker come from one place.
- Azure model listing (`azureProvider.listModels`) is pinned to the retired data-plane api-version `2023-03-15-preview` — newer versions 404 and break `validateConnection`; the configured `apiVersion` only affects inference via `@ai-sdk/azure` (GIT-1310).
- **AI Tool Configs** are a *sibling* feature (same `ai/` dir), distinct from AI Providers: they give the chat assistant external capabilities via `/v1/ai-tools` (platform-admin, EE/Cloud). **AiToolCapability** = `WEB_SEARCH`/`WEB_SCRAPING`/`IMAGE_GENERATION`; **AiToolProvider** = `TAVILY`/`FIRECRAWL`/`APIFY`/`FAL`. One config per capability (unique on platformId+capability); consumed by chat via `getEnabledTools()`.

### Key files
Entry point: `aiProviderModule`, registered in `packages/server/api/src/app/app.ts` right after `aiProviderService(app.log).setup()`.

- `packages/server/api/src/app/ai/` — backend module: provider controller, service, entity, module, plus the sibling ai-tool-config files
- `packages/server/api/src/app/ai/providers/` — per-vendor strategies keyed by `AIProviderName`
- `packages/server/api/src/app/platform/billing-provider.ts` — `assertCreditsAndAppSumoNotExceeded` credit gate
- `packages/server/api/src/app/ee/platform/platform-plan/openrouter/` — OpenRouter key provisioning API
- `packages/core/shared/src/lib/management/ai-providers/index.ts` — shared zod schemas, enums, request/response types
- `packages/core/shared/src/lib/management/ai-tools/index.ts` — shared schemas for the AI Tool Configs sibling
- `packages/web/src/features/platform-admin/api/` + `packages/web/src/features/platform-admin/hooks/` — frontend API clients and TanStack Query hooks (`ai-provider-*`, `ai-tool-config-*`)
- `packages/web/src/app/routes/platform/setup/ai/` — platform admin AI setup page and the `universal-pieces/` provider card, upsert dialog, config form, model popover
- `packages/web/src/app/routes/platform/setup/ai-capabilities/` — admin page, capability dialog, provider catalog for AI Tool Configs
- `packages/web/src/features/agents/ai-model/` — model selector used in agent step settings

Paths verified 2026-07-26.
