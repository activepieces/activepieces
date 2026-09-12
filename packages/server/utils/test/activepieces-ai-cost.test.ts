import { ActivepiecesAiBilling, ActivepiecesAiBillingScope, ActivepiecesAiCostEvent, AIProviderName } from '@activepieces/core-utils'
import { LanguageModelV4 } from '@ai-sdk/provider'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { activepiecesAiCost } from '../src/activepieces-ai-cost'

const BILLING: ActivepiecesAiBilling = {
    scope: ActivepiecesAiBillingScope.PROJECT,
    platformId: 'platform-1',
    projectId: 'project-1',
}

const reported: ActivepiecesAiCostEvent[] = []

function modelReturning(result: Record<string, unknown>): LanguageModelV4 {
    return {
        specificationVersion: 'v4',
        provider: 'test',
        modelId: 'test-model',
        supportedUrls: {},
        doGenerate: async () => result as unknown as Awaited<ReturnType<LanguageModelV4['doGenerate']>>,
        doStream: async () => ({ stream: new ReadableStream() }),
    }
}

async function generateWith(model: ReturnType<typeof activepiecesAiCost.billedLanguageModel>): Promise<void> {
    if (typeof model === 'string') {
        throw new Error('expected a model object')
    }
    await model.doGenerate({ prompt: [] })
}

beforeEach(() => {
    reported.length = 0
    activepiecesAiCost.setReporter((event) => reported.push(event))
})

afterEach(() => {
    activepiecesAiCost.setReporter(() => undefined)
})

describe('what a model call reports back for billing', () => {
    it('bills a managed call on the dollar cost OpenRouter reports', async () => {
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({
                content: [],
                finishReason: 'stop',
                usage: {},
                response: { id: 'gen-abc' },
                providerMetadata: { openrouter: { usage: { cost: 0.0042, promptTokens: 100, completionTokens: 20 } } },
            }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            billing: BILLING,
        })

        await generateWith(model)

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({
            charge: 'observed-cost',
            generationId: 'gen-abc',
            costUsd: 0.0042,
            inputTokens: 100,
            outputTokens: 20,
        })
    })

    it('bills a call on the customer own key at one flat credit, whatever it cost us', async () => {
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({ content: [], finishReason: 'stop', usage: {}, response: { id: 'resp-1' } }),
            provider: AIProviderName.OPENAI,
            modelId: 'gpt-5',
            billing: BILLING,
        })

        await generateWith(model)

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({ charge: 'flat-credits', credits: 1, generationId: 'resp-1' })
    })

    it('counts a managed call whose cost never arrived, instead of quietly billing nothing', async () => {
        const before = activepiecesAiCost.unreportedCallCount()
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({ content: [], finishReason: 'stop', usage: {}, response: { id: 'gen-xyz' } }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            billing: BILLING,
        })

        await generateWith(model)

        expect(reported).toHaveLength(0)
        expect(activepiecesAiCost.unreportedCallCount()).toBe(before + 1)
    })

    it('leaves a model alone when nothing is being billed for it', async () => {
        const raw = modelReturning({ content: [], finishReason: 'stop', usage: {} })
        const model = activepiecesAiCost.billedLanguageModel({
            model: raw,
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            billing: undefined,
        })

        expect(model).toBe(raw)
        await generateWith(model)
        expect(reported).toHaveLength(0)
    })

    it('bills an image model call that cannot be wrapped at the same flat credit', () => {
        activepiecesAiCost.reportFlatCredits({ billing: BILLING, provider: AIProviderName.OPENAI, modelId: 'dall-e-3' })

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({ charge: 'flat-credits', credits: 1 })
    })
})
