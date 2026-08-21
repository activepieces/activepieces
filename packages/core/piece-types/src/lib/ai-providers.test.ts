import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { ACTIVEPIECES_CHAT_TIERS, AI_PROVIDER_CAPABILITIES, aiProviderUtils, ALLOWED_CHAT_MODELS_BY_PROVIDER } from './ai-providers'

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

describe('getCuratedChatModels', () => {
    it('is undefined for providers that pick a model through chat tiers', () => {
        expect(aiProviderUtils.getCuratedChatModels({ provider: AIProviderName.ACTIVEPIECES })).toBeUndefined()
        expect(aiProviderUtils.getCuratedChatModels({ provider: AIProviderName.OPENROUTER })).toBeUndefined()
        expect(aiProviderUtils.getCuratedChatModels({ provider: AIProviderName.BEDROCK })).toBeUndefined()
    })

    it('keeps the declared ids and order', () => {
        for (const provider of [AIProviderName.OPENAI, AIProviderName.ANTHROPIC, AIProviderName.GOOGLE]) {
            const curated = aiProviderUtils.getCuratedChatModels({ provider })
            expect(curated?.map((model) => model.id)).toEqual(ALLOWED_CHAT_MODELS_BY_PROVIDER[provider])
        }
    })

    it('labels every curated model with something other than its raw id', () => {
        for (const provider of [AIProviderName.OPENAI, AIProviderName.ANTHROPIC, AIProviderName.GOOGLE]) {
            for (const model of aiProviderUtils.getCuratedChatModels({ provider }) ?? []) {
                expect(model.label, `missing label for ${model.id}`).not.toBe(model.id)
            }
        }
    })

    it('never returns an empty list, so callers can treat a result as non-empty', () => {
        for (const provider of Object.values(AIProviderName)) {
            expect(aiProviderUtils.getCuratedChatModels({ provider })?.length ?? 1).toBeGreaterThan(0)
        }
    })
})

describe('isCuratedChatModelId', () => {
    it('accepts every tier id and every curated model id', () => {
        for (const tier of ACTIVEPIECES_CHAT_TIERS) {
            expect(aiProviderUtils.isCuratedChatModelId({ modelId: tier.id })).toBe(true)
        }
        for (const curatedIds of Object.values(ALLOWED_CHAT_MODELS_BY_PROVIDER)) {
            for (const id of curatedIds) {
                expect(aiProviderUtils.isCuratedChatModelId({ modelId: id })).toBe(true)
            }
        }
    })

    it('rejects anything outside that vocabulary', () => {
        expect(aiProviderUtils.isCuratedChatModelId({ modelId: 'gpt-9' })).toBe(false)
        expect(aiProviderUtils.isCuratedChatModelId({ modelId: '' })).toBe(false)
    })
})
