import { AIProviderName, isObject } from '@activepieces/core-utils'
import { LanguageModelV3StreamPart } from '@ai-sdk/provider'
import { tool } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { MODEL_STALLED_ERROR_NAME, runAgentTurn } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

describe('a chat turn whose model stops streaming', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('retries the model call once when it sent nothing for 60s, and answers on the retry', async () => {
        const model = scriptedModel([[], answer('hello')])

        const turn = await settle(runTurn({ model }))

        expect(turn.streamError).toBeNull()
        expect(model.doStreamCalls).toHaveLength(2)
        expect(textOf(turn)).toBe('hello')
    })

    it('fails the turn with a tagged stall error when the retry stalls too', async () => {
        const model = scriptedModel([[], []])

        const turn = await settle(runTurn({ model }))

        expect(model.doStreamCalls).toHaveLength(2)
        expect(turn.streamError?.name).toBe(MODEL_STALLED_ERROR_NAME)
    })

    it('does not retry once text already reached the user, so nothing is sent twice', async () => {
        const model = scriptedModel([[...textStart('Half an ans')], answer('hello')])

        const turn = await settle(runTurn({ model }))

        expect(model.doStreamCalls).toHaveLength(1)
        expect(turn.streamError?.name).toBe(MODEL_STALLED_ERROR_NAME)
    })

    it('does not count a long tool call as a stalled model', async () => {
        const search = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ content: [] }), 5 * 60_000)))
        const model = scriptedModel([[...searchCall(), FINISH_TOOL_CALLS], answer('done')])

        const turn = await settle(runTurn({ model, search }))

        expect(turn.streamError).toBeNull()
        expect(model.doStreamCalls).toHaveLength(2)
        expect(textOf(turn)).toBe('done')
    })
})

async function settle<T>(pending: Promise<T>): Promise<T> {
    const outcome = pending.then((value) => ({ value }))
    for (let elapsed = 0; elapsed < 15 * 60_000; elapsed += 10_000) {
        await vi.advanceTimersByTimeAsync(10_000)
    }
    return (await outcome).value
}

function runTurn({ model, search }: { model: MockLanguageModelV3, search?: () => Promise<unknown> }): ReturnType<typeof runAgentTurn> {
    return runAgentTurn({
        models: [{ model, provider: AIProviderName.OPENAI, modelId: 'main', thinkingBudget: 0 }],
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'hello' }],
        tools: {
            ap_web_search: tool({ description: 'search the web', inputSchema: z.object({ query: z.string() }), execute: search ?? (async () => ({ content: [] })) }),
        },
        allToolNames: ['ap_web_search'],
        tier: { id: 'fast', thinkingBudget: 0, modelId: 'main' },
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: SILENT_LOG,
        sinks: { drainStream: (result) => result.consumeStream() },
    })
}

function scriptedModel(scripts: LanguageModelV3StreamPart[][]): MockLanguageModelV3 {
    let call = 0
    return new MockLanguageModelV3({
        doStream: async ({ abortSignal }) => {
            const parts = scripts[call] ?? []
            call++
            const ends = parts.some((part) => part.type === 'finish')
            return {
                stream: new ReadableStream<LanguageModelV3StreamPart>({
                    start(controller) {
                        controller.enqueue({ type: 'stream-start', warnings: [] })
                        parts.forEach((part) => controller.enqueue(part))
                        if (ends) {
                            controller.close()
                            return
                        }
                        abortSignal?.addEventListener('abort', () => controller.error(abortSignal.reason), { once: true })
                    },
                }),
            }
        },
    })
}

function textStart(text: string): LanguageModelV3StreamPart[] {
    return [
        { type: 'text-start', id: 't' },
        { type: 'text-delta', id: 't', delta: text },
    ]
}

function answer(text: string): LanguageModelV3StreamPart[] {
    return [...textStart(text), { type: 'text-end', id: 't' }, { type: 'finish', finishReason: { unified: 'stop', raw: 'stop' }, usage: USAGE }]
}

function searchCall(): LanguageModelV3StreamPart[] {
    return [{ type: 'tool-call', toolCallId: 'call-1', toolName: 'ap_web_search', input: '{"query":"x"}' }]
}

function textOf(turn: Awaited<ReturnType<typeof runAgentTurn>>): string {
    return turn.uiParts.map((part) => isObject(part) && typeof part['text'] === 'string' ? part['text'] : '').join('')
}

const USAGE = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } }
const FINISH_TOOL_CALLS: LanguageModelV3StreamPart = { type: 'finish', finishReason: { unified: 'tool-calls', raw: 'tool_calls' }, usage: USAGE }
const SILENT_LOG = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined }
