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
