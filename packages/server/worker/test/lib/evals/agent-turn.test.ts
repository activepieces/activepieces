import { LanguageModelV4, LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { LanguageModel } from 'ai'
import { describe, expect, it } from 'vitest'
import { evalAgentTurn } from './agent-turn'
import { MetricsRecorder } from './run-metrics'

describe('evalAgentTurn.withCost', () => {
    const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: 0 } }
    const recorderOf = (calls: unknown[]): MetricsRecorder => ({
        modelCall: (call) => {
            calls.push(call)
        },
        timeTools: (tools) => tools,
        summarize: () => {
            throw new Error('unused')
        },
    })
    const streamOf = (chunks: LanguageModelV4StreamPart[]): ReadableStream<LanguageModelV4StreamPart> => new ReadableStream({
        start: (controller) => {
            chunks.forEach((chunk) => controller.enqueue(chunk))
            controller.close()
        },
    })
    const modelWith = (doStream: LanguageModelV4['doStream']): LanguageModelV4 => ({
        specificationVersion: 'v4',
        provider: 'test',
        modelId: 'test',
        supportedUrls: {},
        doGenerate: async () => {
            throw new Error('boom')
        },
        doStream,
    })
    const prompt = { prompt: [] }
    const instance = (model: LanguageModel): Exclude<LanguageModel, string> => {
        if (typeof model === 'string') {
            throw new Error('Expected a model instance')
        }
        return model
    }

    it('records a call whose stream finishes', async () => {
        const calls: unknown[] = []
        const { model } = evalAgentTurn.withCost({ recorder: recorderOf(calls), model: modelWith(async () => ({ stream: streamOf([{ type: 'finish', finishReason: { unified: 'stop', raw: undefined }, usage }]) })) })
        const { stream } = await instance(model).doStream(prompt)
        await stream.pipeTo(new WritableStream())
        expect(calls).toHaveLength(1)
    })

    it('records a call that throws before streaming', async () => {
        const calls: unknown[] = []
        const { model } = evalAgentTurn.withCost({ recorder: recorderOf(calls), model: modelWith(async () => {
            throw new Error('boom')
        }) })
        await expect(instance(model).doStream(prompt)).rejects.toThrow('boom')
        await expect(instance(model).doGenerate(prompt)).rejects.toThrow('boom')
        expect(calls).toEqual([expect.objectContaining({ usage: null }), expect.objectContaining({ usage: null })])
    })

    it('records a stream that is cancelled or ends without a finish chunk', async () => {
        const calls: unknown[] = []
        const { model } = evalAgentTurn.withCost({ recorder: recorderOf(calls), model: modelWith(async () => ({ stream: streamOf([{ type: 'text-delta', id: '1', delta: 'x' }]) })) })
        const cancelled = await instance(model).doStream(prompt)
        await cancelled.stream.cancel()
        const drained = await instance(model).doStream(prompt)
        await drained.stream.pipeTo(new WritableStream())
        expect(calls).toHaveLength(2)
        expect(calls).toEqual([expect.objectContaining({ usage: null }), expect.objectContaining({ usage: null })])
    })
})
