import { AIProviderName, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'
import { selectEmbedder, ToolSearchEmbedder } from './embedder'

/**
 * DB-coupled resolution of the embedder for a platform: looks up the OpenAI provider key the same
 * way copilot/chat do, then hands it to the pure {@link selectEmbedder} seam. Kept separate from
 * `embedder.ts` so that the unit-tested seam never transitively imports `aiProviderService`.
 *
 * Returns `null` whenever no usable key exists — when no OpenAI provider is configured
 * (`getConfigOrThrow` throws) or the stored key is empty. A `null` is the signal to degrade to the
 * keyword floor (ENGINE_IMPLEMENTATION §8); the floor itself lands in Phase 5.
 */
export async function resolveEmbedder({ platformId, log }: ResolveEmbedderParams): Promise<ToolSearchEmbedder | null> {
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
