# AI Providers

## Summary
The AI Providers module lets platform admins configure one or more LLM backends (OpenAI, Anthropic, Google, Azure, OpenRouter, Cloudflare, or a custom OpenAI-compatible endpoint) for use by AI pieces inside flows. It also supports an auto-provisioned "Activepieces" provider backed by OpenRouter when the platform's `aiCreditsEnabled` plan flag is set, complete with a Stripe-integrated credit top-up system and monthly reset via a system job.

## Key Files
- `packages/server/api/src/app/ai/` — backend module (controller, service, entity)
- `packages/core/shared/src/lib/management/ai-providers/index.ts` — all shared Zod schemas, enums, and request/response types
- `packages/web/src/features/platform-admin/api/ai-provider-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/ai-provider-hooks.ts` — TanStack Query hooks
- `packages/web/src/app/routes/platform/setup/ai/index.tsx` — platform admin AI setup page
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/ai-provider-card.tsx` — per-provider card component
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/upsert-provider-dialog.tsx` — create/edit provider dialog
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/upsert-provider-config-form.tsx` — provider config form
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/model-form-popover.tsx` — model selection popover
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/discover-models-dialog.tsx` — Cloudflare-only dialog for dynamic model discovery via upstream provider pass-through
- `packages/web/src/features/agents/ai-model/index.tsx` — AI model selector used in agent step settings
- `packages/web/src/features/agents/ai-model/hooks.ts` — hooks for listing available models per provider

## Edition Availability
- **Community (CE)**: Not available — the module is only registered for EE and Cloud editions in `app.ts`.
- **Enterprise (EE)**: Available; all provider types supported; ACTIVEPIECES auto-provision requires `aiCreditsEnabled` plan flag.
- **Cloud**: Available; ACTIVEPIECES provider auto-provisioned when `OPENROUTER_PROVISION_KEY` env var is set and `aiCreditsEnabled` is true.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **AIProvider**: A platform-scoped entity linking an LLM vendor's credentials to the platform.
- **AIProviderName**: Enum of supported vendors (`openai`, `anthropic`, `google`, `azure`, `openrouter`, `cloudflare-gateway`, `custom`, `activepieces`).
- **EncryptedObject**: The `auth` field is AES-256-encrypted at rest; decrypted only for engine access.
- **AI Credits**: Platform-level usage budget (1000 credits = $1 USD) metered through OpenRouter; drives the ACTIVEPIECES auto-provision flow.
- **aiCreditsEnabled**: Platform plan flag that triggers auto-provisioning of the ACTIVEPIECES provider.
- **Model cache**: In-memory cache of models per provider, cleared daily at midnight via cron.
- **CloudflareGatewayDiscoveryProvider**: Enum of upstream providers (`openai`, `anthropic`, `google-vertex-ai`) that can be queried for model discovery through Cloudflare's pass-through routing.
- **CloudflareGatewayModelFilter**: Optional filter object (search string, vendor list, zdrOnly boolean) applied to discovered models before returning them to the UI.
- **CLOUDFLARE_GATEWAY_MODEL_METADATA**: Curated lookup table keyed by `"{gatewayProvider}/{modelId}"` mapping to `{ vendor, zdrEligible }`. Provider APIs do not expose ZDR/vendor metadata, so this table is maintained by hand (same pattern as `ALLOWED_CHAT_MODELS_BY_PROVIDER`).

## Entity

**AIProvider**: id, displayName, platformId (UNIQUE with provider), provider (AIProviderName enum), auth (EncryptedObject), config (JSON). Relation: platform (CASCADE).

## Supported Providers (8)

| Provider | Auth Fields | Notes |
|----------|------------|-------|
| OPENAI | apiKey | GPT models, responses model variant |
| ANTHROPIC | apiKey | Claude models |
| GOOGLE | apiKey | Gemini models |
| AZURE | apiKey, deploymentName, instanceName | Azure OpenAI |
| OPENROUTER | apiKey | 200+ models |
| CLOUDFLARE | apiKey, accountId, gatewayId | Proxied via Cloudflare AI Gateway; supports upstream model discovery for OpenAI, Anthropic, and Google Vertex AI |
| CUSTOM | apiKey, baseUrl | OpenAI-compatible (LM Studio, Ollama) |
| ACTIVEPIECES | apiKey, apiKeyHash (auto-provisioned) | Uses OpenRouter, managed by platform |

## Activepieces Provider (OpenRouter)

Auto-created when `aiCreditsEnabled` flag is true (`OPENROUTER_PROVISION_KEY` env var set):
1. `getOrCreateActivePiecesProviderAuthConfig()` auto-creates provider
2. `enrichWithKeysIfNeeded()` calls OpenRouter API to create API key
3. Key limit set to `platform.plan.includedAiCredits / 1000` (1000 credits = $1)
4. Schedules `AI_CREDIT_UPDATE_CHECK` system job for auto-renewal and top-up

## Credit System

- Rate: 1000 credits = $1 USD
- OpenRouter meters usage per API key
- Usage cached 180 seconds
- Monthly reset of included credits via system job
- Auto top-up: when remaining < threshold, creates Stripe invoice

## Model Caching

Models listed per provider are cached in memory. Cache cleared daily at midnight via cron.

## Endpoints

- `GET /` — list providers (auto-creates ACTIVEPIECES if credits enabled)
- `GET /:provider/config` — get provider config + decrypted auth (engine-only access)
- `GET /:provider/models` — list available models (cached)
- `POST /` — create provider (validates credentials first)
- `POST /:id` — update provider (re-validates if auth changed, cannot update ACTIVEPIECES)
- `DELETE /:id` — delete provider (cannot delete ACTIVEPIECES)
- `POST /:provider/models/discover` — discover upstream models through Cloudflare AI Gateway (platform admin only, Cloudflare-only); accepts `DiscoverAIProviderModelsRequest` body with auth + config + discovery sub-provider; returns `AIProviderModel[]`

## Engine Integration

During flow execution, AI pieces call `GET /v1/ai-providers/{provider}/config` to get credentials. The engine token provides authorization.

## Frontend

The platform admin AI setup page lives at `/platform/setup/ai`. It renders an `ai-provider-card` for each configured provider and an "Add Provider" button that opens `upsert-provider-dialog`. The `upsert-provider-config-form` adapts its fields to the selected `AIProviderName`. The `model-form-popover` lets admins configure which models are exposed per provider.

For Cloudflare Gateway, a "Discover Models" button opens `discover-models-dialog`, which lets admins query the upstream provider (OpenAI, Anthropic, or Google Vertex AI) through Cloudflare's pass-through routing. Results appear as checkboxes; selected models are appended to the manual list with automatic deduplication against existing entries.

Inside the builder, the agent step settings use `features/agents/ai-model/index.tsx` (with `hooks.ts`) to render a model selector that queries `GET /v1/ai-providers/:provider/models` via `aiProviderApi.listModelsForProvider()`.

## AI Tool Configs (Capabilities)

A sibling feature under `packages/server/api/src/app/ai/`, distinct from AI Providers (LLM vendors). It lets platform admins give the chat assistant external **capabilities** — web search, web scraping, image generation — by storing per-provider API keys. Consumed by the chat feature (#13906) via `getEnabledTools()`.

### Key Files
- `packages/server/api/src/app/ai/ai-tool-config-controller.ts` — CRUD controller (`/v1/ai-tools`), all routes `platformAdminOnly`
- `packages/server/api/src/app/ai/ai-tool-config-service.ts` — list/upsert/update/delete/getEnabledTools (auth encrypted at rest, ownership checked before update/delete)
- `packages/server/api/src/app/ai/ai-tool-config.module.ts` — module registration (EE/Cloud only)
- `packages/core/shared/src/lib/management/ai-tools/index.ts` — shared Zod schemas/enums
- `packages/web/src/features/platform-admin/api/ai-tool-config-api.ts` + `hooks/ai-tool-config-hooks.ts` — frontend client + TanStack Query hooks
- `packages/web/src/app/routes/platform/setup/ai-capabilities/` — admin page, capability dialog, provider catalog

### Endpoints (platform-admin only, EE/Cloud)
- `GET /v1/ai-tools` — list configs (returns `AiToolConfigWithoutSensitiveData`, `auth` stripped)
- `POST /v1/ai-tools` — upsert a capability config (one per capability)
- `POST /v1/ai-tools/:id` — update (e.g. toggle `enabled`)
- `DELETE /v1/ai-tools/:id` — delete

### Edition Availability
`aiToolConfigModule` is registered only in EE and Cloud editions in `app.ts` (not Community). The frontend page is gated to platform admins.

### Entity
**AiToolConfig**: id, platformId, capability (`AiToolCapability`), provider (`AiToolProvider`), auth (EncryptedObject), config (JSON, nullable), enabled (boolean). Unique on (platformId, capability). Relation: platform (CASCADE).

### Domain Terms
- **AiToolConfig**: platform-scoped row binding a capability to a provider's encrypted credentials.
- **AiToolCapability**: `WEB_SEARCH`, `WEB_SCRAPING`, `IMAGE_GENERATION`.
- **AiToolProvider**: `TAVILY`, `FIRECRAWL`, `APIFY`, `FAL`.
- **AiToolConfigWithoutSensitiveData**: list/read DTO with `auth` removed and a `hasApiKey` boolean.
