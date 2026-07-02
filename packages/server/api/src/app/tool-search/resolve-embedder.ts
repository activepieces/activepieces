import { AIProviderName, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { selectEmbedder, ToolSearchEmbedder } from './embedder'

/**
 * Resolves the embedder used for both indexing (backfill + reindex) and query-time search.
 *
 * Resolution order:
 *  1. `AP_OPENAI_API_KEY` (env) — when set it funds ALL tool-search embedding (backfill, reindex, and
 *     queries), so no per-platform provider config is required. This is the simplest path for
 *     self-host / single-tenant deployments and keeps every embedding moment on one key.
 *  2. The platform's OpenAI provider key in the `ai_provider` table (the same lookup copilot/chat use)
 *     — the fallback so existing/multi-tenant deployments keep working when the env var is unset.
 *  3. Otherwise `null` — the signal to degrade to the keyword floor (ENGINE_IMPLEMENTATION §8).
 *
 * Kept separate from `embedder.ts` so the unit-tested seam never transitively imports
 * `aiProviderService`.
 */
export async function resolveEmbedder({ platformId, log }: ResolveEmbedderParams): Promise<ToolSearchEmbedder | null> {
    const envApiKey = system.get(AppSystemProp.OPENAI_API_KEY)
    if (!isNil(envApiKey) && envApiKey !== '') {
        return selectEmbedder(envApiKey)
    }
    const { data: config } = await tryCatch(() =>
        aiProviderService(log).getConfigOrThrow({ platformId, provider: AIProviderName.OPENAI }),
    )
    if (isNil(config)) {
        return null
    }
    const apiKey = 'apiKey' in config.auth ? config.auth.apiKey : undefined
    return selectEmbedder(apiKey)
}

type ResolveEmbedderParams = {
    platformId: string
    log: FastifyBaseLogger
}
