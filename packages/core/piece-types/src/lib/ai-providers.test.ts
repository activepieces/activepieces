import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { ACTIVEPIECES_CHAT_TIERS, AI_PROVIDER_CAPABILITIES, AIProviderModelType, aiProviderUtils, ALLOWED_CHAT_MODELS_BY_PROVIDER } from './ai-providers'

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

    it('declares a default embedding model only for providers that own one', () => {
        const embedding = Object.values(AIProviderName).filter(
            (provider) => AI_PROVIDER_CAPABILITIES[provider].defaultEmbeddingModel !== undefined,
        )
        expect(embedding.sort()).toEqual([
            AIProviderName.ACTIVEPIECES,
            AIProviderName.AZURE,
            AIProviderName.GOOGLE,
            AIProviderName.OPENAI,
            AIProviderName.OPENROUTER,
        ].sort())
    })
})

describe('resolveEmbeddingModelId', () => {
    const gatewayConfig = (modelIds: string[]) => ({
        accountId: 'acct',
        gatewayId: 'gw',
        models: modelIds.map((modelId) => ({ modelId, modelName: modelId, modelType: AIProviderModelType.TEXT })),
    })

    it('returns the provider default for providers that own an embedding model', () => {
        for (const provider of Object.values(AIProviderName)) {
            if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
                continue
            }
            expect(aiProviderUtils.resolveEmbeddingModelId({ provider, config: {} }))
                .toBe(AI_PROVIDER_CAPABILITIES[provider].defaultEmbeddingModel)
        }
    })

    it('embeds through a gateway that routes to OpenAI', () => {
        const modelId = aiProviderUtils.resolveEmbeddingModelId({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            config: gatewayConfig(['anthropic/claude-sonnet-4-6', 'openai/gpt-4.1']),
        })
        expect(modelId).toBe(AI_PROVIDER_CAPABILITIES[AIProviderName.OPENAI].defaultEmbeddingModel)
    })

    it('matches the OpenAI prefix regardless of case or padding', () => {
        expect(aiProviderUtils.resolveEmbeddingModelId({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            config: gatewayConfig([' OpenAI/GPT-4.1 ']),
        })).toBe(AI_PROVIDER_CAPABILITIES[AIProviderName.OPENAI].defaultEmbeddingModel)
    })

    it('refuses a gateway with no OpenAI upstream, so the UI never offers what would fail', () => {
        expect(aiProviderUtils.resolveEmbeddingModelId({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            config: gatewayConfig(['anthropic/claude-sonnet-4-6', 'google-ai-studio/gemini-2.5-pro']),
        })).toBeUndefined()
        expect(aiProviderUtils.resolveEmbeddingModelId({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            config: gatewayConfig([]),
        })).toBeUndefined()
    })

    it('never matches a provider name that merely contains openai', () => {
        expect(aiProviderUtils.resolveEmbeddingModelId({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            config: gatewayConfig(['azure-openai/gpt-4.1', 'openai-compatible-thing']),
        })).toBeUndefined()
    })

    it('refuses a config that is not a gateway config', () => {
        for (const config of [undefined, null, {}, { models: 'nope' }, { accountId: 'a', gatewayId: 'g' }]) {
            expect(aiProviderUtils.resolveEmbeddingModelId({ provider: AIProviderName.CLOUDFLARE_GATEWAY, config })).toBeUndefined()
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
