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
- **AI Tool Configs** are a *sibling* feature (same `ai/` dir), distinct from AI Providers: they give the chat assistant external capabilities via `/v1/ai-tools` (platform-admin, EE/Cloud). **AiToolCapability** = `WEB_SEARCH`/`WEB_SCRAPING`/`IMAGE_GENERATION`; **AiToolProvider** = `TAVILY`/`FIRECRAWL`/`APIFY`/`FAL`. One config per capability (unique on platformId+capability); consumed by chat via `getEnabledTools()`.

### Key files
Entry point: `aiProviderModule`, registered in `packages/server/api/src/app/app.ts` right after `aiProviderService(app.log).setup()`.

- `packages/server/api/src/app/ai/` — backend module: provider controller, service, entity, module, plus the sibling ai-tool-config files
- `packages/server/api/src/app/ai/providers/` — per-vendor strategies keyed by `AIProviderName`
- `packages/core/shared/src/lib/management/ai-providers/index.ts` — shared zod schemas, enums, request/response types
- `packages/core/shared/src/lib/management/ai-tools/index.ts` — shared schemas for the AI Tool Configs sibling
- `packages/web/src/features/platform-admin/api/` + `packages/web/src/features/platform-admin/hooks/` — frontend API clients and TanStack Query hooks (`ai-provider-*`, `ai-tool-config-*`)
- `packages/web/src/app/routes/platform/setup/ai/` — platform admin AI setup page and the `universal-pieces/` provider card, upsert dialog, config form, model popover
- `packages/web/src/app/routes/platform/setup/ai-capabilities/` — admin page, capability dialog, provider catalog for AI Tool Configs
- `packages/web/src/features/agents/ai-model/` — model selector used in agent step settings

Paths verified 2026-07-17.
