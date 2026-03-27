# AI Module

Multi-provider AI integration with credit management via OpenRouter.

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
