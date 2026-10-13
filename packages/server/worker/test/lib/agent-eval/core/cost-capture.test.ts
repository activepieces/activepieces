import { generateText, streamText } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { costCapture } from './cost-capture'

describe('costCapture.track', () => {
    it('sums the OpenRouter-reported cost across generate and stream calls', async () => {
        const tracked = costCapture.track({ model: mockModel({ cost: 0.25 }) })

        await generateText({ model: tracked.model, prompt: 'hi' })
        await streamText({ model: tracked.model, prompt: 'hi' }).consumeStream()

        expect(tracked.costUsd()).toBe(0.5)
    })

    it('reports an unknown cost instead of undercounting when a call reports none', async () => {
        const tracked = costCapture.track({ model: mockModel({ cost: undefined }) })

        await generateText({ model: tracked.model, prompt: 'hi' })

        expect(tracked.costUsd()).toBeNull()
    })

    it('keeps the cost known when a call is rejected before the provider answers', async () => {
        const answered = mockModel({ cost: 0.25 })
        const tracked = costCapture.track({ model: new MockLanguageModelV3({
            doGenerate: async () => {
                throw new Error('bad request')
            },
            doStream: answered.doStream,
        }) })

        await generateText({ model: tracked.model, prompt: 'hi', maxRetries: 0 }).catch(() => undefined)
        await streamText({ model: tracked.model, prompt: 'hi' }).consumeStream()

        expect(tracked.costUsd()).toBe(0.25)
    })

    it('asks OpenRouter to include usage cost on every call', async () => {
        const model = mockModel({ cost: 0.1 })
        const tracked = costCapture.track({ model })

        await generateText({ model: tracked.model, prompt: 'hi', providerOptions: { openrouter: { reasoning: { max_tokens: 10 } } } })

        expect(model.doGenerateCalls[0].providerOptions?.['openrouter']).toEqual({ reasoning: { max_tokens: 10 }, usage: { include: true } })
    })

    it('costs nothing before any call is made', () => {
        expect(costCapture.track({ model: mockModel({ cost: 1 }) }).costUsd()).toBe(0)
    })
})

function mockModel({ cost }: { cost: number | undefined }): MockLanguageModelV3 {
    const providerMetadata = { openrouter: { usage: cost === undefined ? {} : { cost } } }
    const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } }
    return new MockLanguageModelV3({
        doGenerate: async () => ({
            content: [{ type: 'text' as const, text: 'ok' }],
            finishReason: { unified: 'stop' as const, raw: 'stop' },
            usage,
            providerMetadata,
            warnings: [],
        }),
        doStream: async () => ({
            stream: convertArrayToReadableStream([
                { type: 'text-start' as const, id: 't' },
                { type: 'text-delta' as const, id: 't', delta: 'ok' },
                { type: 'text-end' as const, id: 't' },
                { type: 'finish' as const, finishReason: { unified: 'stop' as const, raw: 'stop' }, usage, providerMetadata },
            ]),
        }),
    })
}
