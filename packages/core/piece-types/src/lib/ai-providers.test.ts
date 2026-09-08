import { AIProviderName, isNil } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { ACTIVEPIECES_CHAT_TIERS, AI_PROVIDER_CAPABILITIES, aiProviderUtils, ALLOWED_CHAT_MODELS_BY_PROVIDER, MANAGED_MODEL_WEIGHTS, MODELS_AWAITING_A_CREDIT_WEIGHT } from './ai-providers'

describe('AI_PROVIDER_CAPABILITIES', () => {
    it('has an entry for every provider', () => {
        for (const provider of Object.values(AIProviderName)) {
            expect(AI_PROVIDER_CAPABILITIES[provider]).toBeDefined()
        }
    })

    it('only the text-only vendors reject image generation', () => {
        const noImage = Object.values(AIProviderName).filter(
            (provider) => !AI_PROVIDER_CAPABILITIES[provider].supportsImageGeneration,
        )
        expect(noImage.sort()).toEqual([
            AIProviderName.ANTHROPIC,
            AIProviderName.MISTRAL,
            AIProviderName.XAI,
            AIProviderName.DEEPSEEK,
            AIProviderName.ZAI,
            AIProviderName.QWEN,
            AIProviderName.MINIMAX,
            AIProviderName.MOONSHOT,
        ].sort())
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

describe('managed chat model vocabulary', () => {
    it('covers every tier model, so tier drift can never deny the model a tier runs on', () => {
        for (const tier of ACTIVEPIECES_CHAT_TIERS) {
            expect(aiProviderUtils.isManagedChatModelId({ modelId: tier.modelId }), tier.modelId).toBe(true)
        }
    })

    it('covers every id the managed allow-list declares', () => {
        for (const id of ALLOWED_CHAT_MODELS_BY_PROVIDER[AIProviderName.ACTIVEPIECES] ?? []) {
            expect(aiProviderUtils.isManagedChatModelId({ modelId: id }), id).toBe(true)
        }
    })

    it('rejects the models that reached managed credits during the 2026-09 incident', () => {
        for (const id of ['google/gemini-3.8-flash', 'openai/gpt-6-astra', 'openai/gpt-6-astra-pro', 'anthropic/claude-fable-5.1']) {
            expect(aiProviderUtils.isManagedChatModelId({ modelId: id }), id).toBe(false)
        }
    })

    it('rejects an empty or arbitrary string', () => {
        expect(aiProviderUtils.isManagedChatModelId({ modelId: '' })).toBe(false)
        expect(aiProviderUtils.isManagedChatModelId({ modelId: 'anything/at-all' })).toBe(false)
    })

    it('lists no duplicates, so an error message never repeats a model', () => {
        const ids = aiProviderUtils.managedChatModelIds()
        expect(ids).toEqual([...new Set(ids)])
    })
})

describe('canDisableReasoning', () => {
    it('is true for every tier model, so the default path keeps its zero-reasoning first step', () => {
        for (const tier of ACTIVEPIECES_CHAT_TIERS) {
            expect(aiProviderUtils.canDisableReasoning({ modelId: tier.modelId }), tier.modelId).toBe(true)
        }
    })

    it('is false for the reasoning-native models that rejected a disable directive in production', () => {
        for (const id of ['google/gemini-3.8-flash', 'openai/gpt-6-astra', 'openai/gpt-6-astra-pro', 'anthropic/claude-fable-5.1']) {
            expect(aiProviderUtils.canDisableReasoning({ modelId: id }), id).toBe(false)
        }
    })

    it('is false for a managed model we have never observed accepting one', () => {
        expect(aiProviderUtils.canDisableReasoning({ modelId: 'google/gemini-3.7-flash' })).toBe(false)
        expect(aiProviderUtils.canDisableReasoning({ modelId: 'x-ai/grok-4.20' })).toBe(false)
    })
})

describe('tier native model ids', () => {
    it('names a model the native Anthropic list actually offers, so no tier resolves to an id that does not exist', () => {
        for (const tier of ACTIVEPIECES_CHAT_TIERS) {
            expect(ALLOWED_CHAT_MODELS_BY_PROVIDER[AIProviderName.ANTHROPIC], tier.id).toContain(tier.nativeModelId)
        }
    })

    it('gives every tier a native id, so none falls back to an arbitrary model', () => {
        for (const tier of ACTIVEPIECES_CHAT_TIERS) {
            expect(tier.nativeModelId, tier.id).toBeTruthy()
        }
    })
})

describe('every managed model we offer has a credit weight somebody chose', () => {
    const offered = ALLOWED_CHAT_MODELS_BY_PROVIDER[AIProviderName.ACTIVEPIECES] ?? []

    const priced = (model: string) =>
        ACTIVEPIECES_CHAT_TIERS.some((tier) => tier.modelId === model) || !isNil(MANAGED_MODEL_WEIGHTS[model])

    it('offers nothing that quietly falls back to the default rate, apart from what is still pending', () => {
        expect(offered.filter((model) => !priced(model))).toEqual(MODELS_AWAITING_A_CREDIT_WEIGHT)
    })

    it('leaves nothing in the pending list that is no longer offered, so the exception cannot outlive the model', () => {
        for (const model of MODELS_AWAITING_A_CREDIT_WEIGHT) {
            expect(offered, model).toContain(model)
        }
    })

    it('never lists a model as both priced and pending', () => {
        for (const model of MODELS_AWAITING_A_CREDIT_WEIGHT) {
            expect(priced(model), model).toBe(false)
        }
    })
})
