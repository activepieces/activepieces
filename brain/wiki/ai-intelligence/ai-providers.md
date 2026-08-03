---
icon: 🧠
---

# AI Providers

Lets platform admins configure one or more LLM backends for AI pieces in flows. Also auto-provisions an "Activepieces" provider (backed by OpenRouter) with a Stripe-integrated AI credit system when the plan's `aiCreditsEnabled` flag is set. EE/Cloud only (not registered in CE).

### Entities & services

- **AIProvider** — platform-scoped: `displayName`, `platformId` (unique with `provider`), `provider` (AIProviderName enum), `auth` (EncryptedObject, AES-256 at rest), `config` (JSON).
- Backend under `packages/server/api/src/app/ai/`; shared schemas in `core/shared/.../ai-providers/`.
- Supported providers (8): `openai`, `anthropic`, `google`, `azure`, `openrouter`, `cloudflare-gateway`, `custom` (OpenAI-compatible, e.g. Ollama/LM Studio), `activepieces` (auto-provisioned via OpenRouter).

### How it works

- `GET /` list (auto-creates ACTIVEPIECES if credits enabled); `GET /:provider/config` returns decrypted auth (engine-only); `GET /:provider/models` (cached); `POST /` create (validates creds first); `POST /:id` update; `DELETE /:id`. ACTIVEPIECES cannot be updated or deleted.
- Engine integration: during flow execution AI pieces call `GET /v1/ai-providers/{provider}/config` for credentials, authorized by the engine token.
- Activepieces provider: `getOrCreateActivePiecesProviderAuthConfig()` → `enrichWithKeysIfNeeded()` creates an OpenRouter key limited to `includedAiCredits / 1000`, then schedules the `AI_CREDIT_UPDATE_CHECK` job.

### AI Credits

- Rate: 1000 credits = $1 USD; metered per OpenRouter API key; usage cached 180s.
- Monthly reset of included credits via system job; auto top-up creates a Stripe invoice when remaining drops below threshold.
- Model lists are cached in memory, cleared daily at midnight via cron.

### Gotchas

- ACTIVEPIECES auto-provision needs `OPENROUTER_PROVISION_KEY` env var set AND `aiCreditsEnabled` true.
- **A failed `enrichWithKeysIfNeeded()` is self-sustaining, and it takes chat down with it.** `createKey` runs on the chat hot path — `chatHelpers.resolveChatProvider` → `getChatProvider` calls it whenever the platform's managed ACTIVEPIECES row has no `apiKey` — and the `save` happens *after* the OpenRouter call, so a failure persists nothing and the next chat turn calls `createKey` again. There is also no distributed lock or cache, so concurrent turns for one platform each mint a live key and only the last is saved; the orphans keep spending provisioning quota. Seen in prod 2026-07-30: `keys-modify-api-rpd-v2` 429 (OpenRouter's key create/modify bucket, 10k/day on the provision key — a *separate* limit from inference), which killed every chat turn for the affected platform in `getChatConfig` before the first token, with no recovery until the bucket reset at 00:00 UTC.
- **`openrouter-api.ts` uses raw `fetch`** — no timeout, no retry, no `tryCatch`, and it bypasses the repo's `safeHttp` rule for outbound HTTP in `packages/server/api`. A `getKey` 408 from OpenRouter escapes the admin `increaseAiCredits` path as an unhandled rejection.
- **Chat model tiers are Activepieces-only.** `ACTIVEPIECES_CHAT_TIERS` (`fast`/`smart`/`premium`, shown as Fast/Expert/Heavy) hold OpenRouter-shaped Anthropic ids, so they only mean anything for the ACTIVEPIECES and OPENROUTER chat providers. Any provider that declares `ALLOWED_CHAT_MODELS_BY_PROVIDER` (openai, anthropic, google) picks a real model id from that list instead. Naively stripping the tier's vendor prefix for every provider is what once sent `claude-haiku-4-5` to OpenAI and broke every message.
- **Read the chat model list through** `aiProviderUtils.getCuratedChatModels({ provider })`**.** It is the one accessor the server resolver (`chatHelpers.resolveModelIdForProvider`) and the chat dropdown share, so the two cannot drift; it returns `{ id, label }` or `undefined` — never an empty list, so callers may treat a result as non-empty. Labels come from the hardcoded `CHAT_MODEL_LABELS` (falling back to the id) rather than `AIProviderModel.name`, because the live `listModels` response cannot supply one for every provider: anthropic returns `display_name` and google `displayName`, but OpenAI's `/v1/models` returns ids only.
- `conversation.modelName` **carries either a tier id or a real model id** — it is a free string with no discriminator. A legacy tier id resolves to the tier's equivalent model when the provider ships it, else the provider's first curated model, so old conversations keep working after a provider switch. Note `premium` maps to opus 4.8, which the native anthropic list does not carry, so a legacy `premium` on anthropic lands on Sonnet.
- **AI Tool Configs** are a *sibling* feature (same `ai/` dir), distinct from AI Providers: they give the chat assistant external capabilities via `/v1/ai-tools` (platform-admin, EE/Cloud). **AiToolCapability** = `WEB_SEARCH`/`WEB_SCRAPING`/`IMAGE_GENERATION`; **AiToolProvider** = `TAVILY`/`FIRECRAWL`/`APIFY`/`FAL`. One config per capability (unique on platformId+capability); consumed by chat via `getEnabledTools()`.

### Key files

Entry point: `aiProviderModule`, registered in `packages/server/api/src/app/app.ts` right after `aiProviderService(app.log).setup()`.

- `packages/server/api/src/app/ai/` — backend module: provider controller, service, entity, module, plus the sibling ai-tool-config files
- `packages/server/api/src/app/ai/providers/` — per-vendor strategies keyed by `AIProviderName`
- `packages/server/api/src/app/ee/platform/platform-plan/openrouter/openrouter-api.ts` — the OpenRouter provisioning client (`createKey`/`updateKey`/`getKey`/`listKeys`)
- `packages/core/shared/src/lib/management/ai-providers/index.ts` — shared zod schemas, enums, request/response types
- `packages/core/shared/src/lib/management/ai-tools/index.ts` — shared schemas for the AI Tool Configs sibling
- `packages/web/src/features/platform-admin/api/` + `packages/web/src/features/platform-admin/hooks/` — frontend API clients and TanStack Query hooks (`ai-provider-*`, `ai-tool-config-*`)
- `packages/web/src/app/routes/platform/setup/ai/` — platform admin AI setup page and the `universal-pieces/` provider card, upsert dialog, config form, model popover
- `packages/web/src/app/routes/platform/setup/ai-capabilities/` — admin page, capability dialog, provider catalog for AI Tool Configs
- `packages/web/src/features/agents/ai-model/` — model selector used in agent step settings

Paths verified 2026-07-17.
