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
3. Key minted with a fixed spend guardrail of **$1000 / month** (`limit: 1000, limit_reset: 'monthly'`) — a hard ceiling against runaway cost, independent of the Autumn-metered credit balance. See `MANAGED_OPENROUTER_KEY_MONTHLY_LIMIT_USD` in `ai-provider-service.ts`.
4. Schedules `AI_CREDIT_UPDATE_CHECK` system job for auto-renewal and top-up

> **Older keys predate the monthly guardrail** (they were minted with a lifetime `limit: 20` and no reset). Normalize them with the one-off backfill script below **before deploying** the monthly-limit change.

## Credit System

- Rate: 1000 credits = $1 USD
- OpenRouter meters usage per API key
- Usage cached 180 seconds
- Monthly reset of included credits via system job
- Auto top-up: when remaining < threshold, creates Stripe invoice

## Operational: OpenRouter key-limit backfill (run before deployment)

The creation path mints new managed keys at `$1000 / monthly`, but keys created before that change carry the old lifetime `$20` cap. Because the per-key limits live in **OpenRouter, not our database**, this is not a DB migration — it's a one-off HTTP backfill you run with the provisioning key from any machine (Node 18+, no Activepieces deps, no repo checkout needed).

**Run it once, against production's `OPENROUTER_PROVISION_KEY`, right before deploying the monthly-limit change.**

```bash
# 1) Dry run first — lists exactly what would change, touches nothing:
OPENROUTER_PROVISION_KEY=sk-or-... node backfill-openrouter-limits.mjs

# 2) Apply once the dry run looks right:
OPENROUTER_PROVISION_KEY=sk-or-... node backfill-openrouter-limits.mjs --apply
```

Behavior: paginates all keys (`offset`, 100/page, incl. disabled), filters to names starting with `Platform ` (the managed per-platform keys — override with `--name-prefix=`), skips any key already at `1000`/`monthly` (idempotent), goes sequential with a 250ms delay (`--delay=`) and backs off on `429`. It **forces** `limit: 1000` on every matching key — this overwrites any prior admin `increaseAiCredits` top-ups (intentional: the monthly guardrail replaces the lifetime top-up model).

<details>
<summary><code>backfill-openrouter-limits.mjs</code></summary>

```js
#!/usr/bin/env node
// One-off backfill: normalize managed OpenRouter keys to $1000 / monthly.
//
// Runs anywhere with Node 18+ (global fetch). No Activepieces deps.
//
//   OPENROUTER_PROVISION_KEY=sk-or-... node backfill-openrouter-limits.mjs           # dry run
//   OPENROUTER_PROVISION_KEY=sk-or-... node backfill-openrouter-limits.mjs --apply   # actually patch
//
// Flags:
//   --apply            perform PATCHes (omit for a dry run that only prints what would change)
//   --name-prefix=STR  only touch keys whose name starts with STR (default "Platform ")
//   --delay=MS         delay between requests (default 250)

const BASE_URL = 'https://openrouter.ai/api/v1'
const TARGET_LIMIT = 1000
const TARGET_RESET = 'monthly'
const PAGE_SIZE = 100

const apiKey = process.env.OPENROUTER_PROVISION_KEY
if (!apiKey) {
    console.error('Set OPENROUTER_PROVISION_KEY in the environment.')
    process.exit(1)
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const namePrefix = (args.find((a) => a.startsWith('--name-prefix=')) ?? '--name-prefix=Platform ').split('=').slice(1).join('=')
const delayMs = Number((args.find((a) => a.startsWith('--delay=')) ?? '--delay=250').split('=')[1])

const authHeaders = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function request(method, path, body) {
    for (let attempt = 0; attempt < 6; attempt++) {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: authHeaders,
            body: body ? JSON.stringify(body) : undefined,
        })
        if (res.status === 429) {
            const wait = Math.min(30000, 1000 * 2 ** attempt)
            console.warn(`  429 rate limited, backing off ${wait}ms`)
            await sleep(wait)
            continue
        }
        if (!res.ok) {
            throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`)
        }
        return res.json()
    }
    throw new Error(`${method} ${path} -> gave up after repeated 429s`)
}

async function listAllKeys() {
    const all = []
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data } = await request('GET', `/keys?offset=${offset}&include_disabled=true`)
        all.push(...data)
        if (data.length < PAGE_SIZE) break
        await sleep(delayMs)
    }
    return all
}

async function main() {
    console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'} | name prefix: "${namePrefix}" | target: $${TARGET_LIMIT}/${TARGET_RESET}`)
    const keys = await listAllKeys()
    const managed = keys.filter((k) => (k.name ?? '').startsWith(namePrefix))
    console.log(`Fetched ${keys.length} keys; ${managed.length} match the name prefix.`)

    let updated = 0, skipped = 0, failed = 0
    for (const key of managed) {
        const alreadyCorrect = key.limit === TARGET_LIMIT && key.limit_reset === TARGET_RESET
        if (alreadyCorrect) {
            skipped++
            continue
        }
        console.log(`${apply ? 'PATCH' : 'would patch'} ${key.hash} (${key.name}) limit=${key.limit}->${TARGET_LIMIT} reset=${key.limit_reset}->${TARGET_RESET}`)
        if (apply) {
            try {
                await request('PATCH', `/keys/${key.hash}`, { limit: TARGET_LIMIT, limit_reset: TARGET_RESET })
                updated++
            }
            catch (err) {
                failed++
                console.error(`  FAILED ${key.hash}: ${err.message}`)
            }
            await sleep(delayMs)
        }
    }
    console.log(`\nDone. ${apply ? 'updated' : 'would update'}=${updated + (apply ? 0 : managed.length - skipped)} skipped(already correct)=${skipped} failed=${failed}`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
```

</details>

## Model Caching

Models listed per provider are cached in memory. Cache cleared daily at midnight via cron.

## Endpoints

Reads are open to any platform member (`GET /` / `/:provider/models` allow USER + ENGINE; `/:provider/config` is engine-only). Mutations are **platform-admin only**.

- `GET /` — list providers (auto-creates ACTIVEPIECES if credits enabled)
- `GET /:provider/config` — get provider config + decrypted auth (engine-only access). For the managed `ACTIVEPIECES` provider this route is also the **credit gate**: `assertCreditsAndAppSumoNotExceeded` (`platform/billing-provider.ts`) throws `QUOTA_EXCEEDED` when the platform's credit or AppSumo balance is blocked. The AI piece fetches config on every AI action execution, so the gate fires per AI call — including every iteration of a loop — but usage is only metered post-run/post-message, so a run's own in-flight spend is invisible to it. See `docs/adr/0012-managed-ai-metering-moves-to-centralized-worker-execution.md`.
- `GET /:provider/models` — list available models (cached)
- `POST /` — create provider (platform-admin only; validates credentials first)
- `POST /:id` — update provider (platform-admin only; re-validates if auth changed, cannot update ACTIVEPIECES)
- `DELETE /:id` — delete provider (platform-admin only; cannot delete ACTIVEPIECES)

## Engine Integration

During flow execution, AI pieces call `GET /v1/ai-providers/{provider}/config` to get credentials (`createAIModel` → `fetchProviderConfig` in `packages/pieces/community/ai/src/lib/common/ai-sdk.ts`). The engine token provides authorization. The fetch happens on **every AI action execution** — there is no per-run caching — which is what makes the config route an effective per-call credit gate for the managed provider (see Endpoints above and ADR 0012).

## Frontend

The platform admin AI setup page lives at `/platform/setup/ai`. It renders an `ai-provider-card` for each configured provider and an "Add Provider" button that opens `upsert-provider-dialog`. The `upsert-provider-config-form` adapts its fields to the selected `AIProviderName`. The `model-form-popover` lets admins configure which models are exposed per provider.

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
