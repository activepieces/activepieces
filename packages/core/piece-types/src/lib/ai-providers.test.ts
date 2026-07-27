import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { AI_PROVIDER_CAPABILITIES } from './ai-providers'

describe('AI_PROVIDER_CAPABILITIES', () => {
    it('has an entry for every provider', () => {
        for (const provider of Object.values(AIProviderName)) {
            expect(AI_PROVIDER_CAPABILITIES[provider]).toBeDefined()
        }
    })

    it('only Anthropic and Mistral reject image generation', () => {
        const noImage = Object.values(AIProviderName).filter(
            (provider) => !AI_PROVIDER_CAPABILITIES[provider].supportsImageGeneration,
        )
        expect(noImage.sort()).toEqual([AIProviderName.ANTHROPIC, AIProviderName.MISTRAL].sort())
    })

    it('marks embedding support iff a default embedding model exists', () => {
        for (const provider of Object.values(AIProviderName)) {
            const caps = AI_PROVIDER_CAPABILITIES[provider]
            expect(caps.supportsEmbedding).toBe(caps.defaultEmbeddingModel !== undefined)
        }
    })
})
