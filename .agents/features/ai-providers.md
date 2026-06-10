# AI Providers

## Summary
The AI Providers module lets platform admins configure one or more LLM backends (OpenAI, Anthropic, Google, Azure, OpenRouter, Cloudflare, or a custom OpenAI-compatible endpoint) for use by AI pieces inside flows. It also supports an auto-provisioned "Activepieces" provider backed by OpenRouter when the platform's `aiCreditsEnabled` plan flag is set, complete with a Stripe-integrated credit top-up system and monthly reset via a system job.

## Key Files
- `packages/server/api/src/app/ai/` — backend module (controller, service, entity)
- `packages/shared/src/lib/management/ai-providers/index.ts` — all shared Zod schemas, enums, and request/response types
- `packages/web/src/features/platform-admin/api/ai-provider-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/ai-provider-hooks.ts` — TanStack Query hooks
- `packages/web/src/app/routes/platform/setup/ai/index.tsx` — platform admin AI setup page
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/ai-provider-card.tsx` — per-provider card component
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/upsert-provider-dialog.tsx` — create/edit provider dialog
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/upsert-provider-config-form.tsx` — provider config form
- `packages/web/src/app/routes/platform/setup/ai/universal-pieces/model-form-popover.tsx` — model selection popover
- `packages/web/src/features/agents/ai-model/index.tsx` — AI model selector used in agent step settings
- `packages/web/src/features/agents/ai-model/hooks.ts` — hooks for listing available models per provider

## Edition Availability
- **Community (CE)**: Not available — the module is only registered for EE and Cloud editions in `app.ts`.
- **Enterprise (EE)**: Available; all provider types supported; ACTIVEPIECES auto-provision requires `aiCreditsEnabled` plan flag.
- **Cloud**: Available; ACTIVEPIECES provider auto-provisioned when `OPENROUTER_PROVISION_KEY` env var is set and `aiCreditsEnabled` is true.

## Domain Terms
- **AIProvider**: A platform-scoped entity linking an LLM vendor's credentials to the platform.
- **AIProviderName**: Enum of supported vendors (`openai`, `anthropic`, `google`, `azure`, `openrouter`, `cloudflare-gateway`, `custom`, `activepieces`).
- **EncryptedObject**: The `auth` field is AES-256-encrypted at rest; decrypted only for engine access.
- **AI Credits**: Platform-level usage budget (1000 credits = $1 USD) metered through OpenRouter; drives the ACTIVEPIECES auto-provision flow.
- **aiCreditsEnabled**: Platform plan flag that triggers auto-provisioning of the ACTIVEPIECES provider.
- **Model cache**: In-memory cache of models per provider, cleared daily at midnight via cron.

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
| CLOUDFLARE | apiKey, accountId, gatewayId | Proxied via Cloudflare Workers AI |
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

## Engine Integration

During flow execution, AI pieces call `GET /v1/ai-providers/{provider}/config` to get credentials. The engine token provides authorization.

## Frontend

The platform admin AI setup page lives at `/platform/setup/ai`. It renders an `ai-provider-card` for each configured provider and an "Add Provider" button that opens `upsert-provider-dialog`. The `upsert-provider-config-form` adapts its fields to the selected `AIProviderName`. The `model-form-popover` lets admins configure which models are exposed per provider.

Inside the builder, the agent step settings use `features/agents/ai-model/index.tsx` (with `hooks.ts`) to render a model selector that queries `GET /v1/ai-providers/:provider/models` via `aiProviderApi.listModelsForProvider()`.
