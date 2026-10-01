import { AIProviderName, isObject } from '@activepieces/core-utils'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { APICallError, streamText, tool, toUIMessageStream } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { drainOf, NO_STEP_CONTENT, runAgentTurn, StepContentState, StreamDrain, trackStepContent, TurnModel } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

describe('a platform tier chat turn', () => {
    it('answers on the next model when the main model fails before sending anything', async () => {
        const onModelSwitch = vi.fn()

        const turn = await runTurn({ models: [tierModel({ modelId: 'main', model: failingModel({ statusCode: 503 }) }), tierModel({ modelId: 'backup', model: answeringModel('from backup') })], onModelSwitch })

        expect(turn.streamError).toBeNull()
        expect(turn.answeredBy.modelId).toBe('backup')
        expect(onModelSwitch).toHaveBeenCalledWith(expect.objectContaining({ modelId: 'backup' }))
        expect(textOf(turn)).toBe('from backup')
    })

    it('continues on the next model after the fast step already answered and ran a tool, without running it again', async () => {
        const search = vi.fn(async () => ({ content: [{ type: 'text', text: 'found' }] }))
        const backup = answeringModel('done')

        const turn = await runTurn({
            models: [tierModel({ modelId: 'main', model: failingModel({ statusCode: 503 }) }), tierModel({ modelId: 'backup', model: backup })],
            fastModel: tierModel({ modelId: 'fast', model: searchingModel() }),
            search,
        })

        expect(turn.streamError).toBeNull()
        expect(turn.answeredBy.modelId).toBe('backup')
        expect(search).toHaveBeenCalledTimes(1)
        expect(textOf(turn)).toBe('Looking.done')
        expect(JSON.stringify(backup.doStreamCalls[0].prompt)).toContain('found')
    })

    it('does not fall back once the failing step already sent text to the user', async () => {
        const backup = answeringModel('from backup')

        const turn = await runTurn({ models: [tierModel({ modelId: 'main', model: textThenFailingModel() }), tierModel({ modelId: 'backup', model: backup })] })

        expect(turn.streamError).not.toBeNull()
        expect(backup.doStreamCalls).toHaveLength(0)
    })

    it('drops a failing fast model and answers on the same main model', async () => {
        const turn = await runTurn({
            models: [tierModel({ modelId: 'main', model: answeringModel('from main') }), tierModel({ modelId: 'backup', model: answeringModel('from backup') })],
            fastModel: tierModel({ modelId: 'fast', model: failingModel({ statusCode: 429 }) }),
        })

        expect(turn.streamError).toBeNull()
        expect(turn.answeredBy.modelId).toBe('main')
        expect(textOf(turn)).toBe('from main')
    })

    it('fails on a bad request instead of trying the next model', async () => {
        const backup = answeringModel('from backup')

        const turn = await runTurn({ models: [tierModel({ modelId: 'main', model: failingModel({ statusCode: 400 }) }), tierModel({ modelId: 'backup', model: backup })] })

        expect(turn.streamError).not.toBeNull()
        expect(backup.doStreamCalls).toHaveLength(0)
        expect(turn.allModelsFailed).toBe(false)
    })

    it('says every model failed when the whole tier is down', async () => {
        const turn = await runTurn({ models: [tierModel({ modelId: 'main', model: failingModel({ statusCode: 503 }) }), tierModel({ modelId: 'backup', model: failingModel({ statusCode: 503 }) })] })

        expect(turn.allModelsFailed).toBe(true)
    })

    it('builds the provider options for the model that runs, not the one that failed', async () => {
        const sent: SharedV3ProviderOptions[] = []
        const backup = answeringModel('from backup', sent)

        await runTurn({
            models: [
                tierModel({ modelId: 'claude', model: failingModel({ statusCode: 503 }), provider: AIProviderName.ANTHROPIC }),
                tierModel({ modelId: 'gpt', model: backup, provider: AIProviderName.OPENAI }),
            ],
        })

        expect(sent[0]).not.toHaveProperty('anthropic')
    })

    it('reports a provider failure for the key that failed', async () => {
        const onModelOutcome = vi.fn()

        await runTurn({ models: [tierModel({ modelId: 'main', model: failingModel({ statusCode: 503 }) }), tierModel({ modelId: 'backup', model: answeringModel('ok') })], onModelOutcome })

        expect(onModelOutcome).toHaveBeenCalledWith(expect.objectContaining({ turnModel: expect.objectContaining({ modelId: 'main' }), signal: expect.objectContaining({ statusCode: 503 }) }))
    })

    it('leaves a single specific model on today\'s path, with no fallback', async () => {
        const turn = await runTurn({ models: [{ model: failingModel({ statusCode: 503 }), provider: AIProviderName.OPENAI, modelId: 'only', thinkingBudget: 0 }] })

        expect(turn.streamError).not.toBeNull()
        expect(turn.allModelsFailed).toBe(false)
    })
})

describe('what counts as content sent in the step that failed', () => {
    it('ignores the start markers the stream sends before any content', () => {
        expect(sentContentAfter(['start', 'error'])).toBe(false)
    })

    it('counts a step that failed after a step that finished as clean', () => {
        expect(sentContentAfter(['start', 'start-step', 'text-delta', 'tool-output-available', 'finish-step', 'error'])).toBe(false)
    })

    it('counts text sent before the error, even though the step is closed after it', () => {
        expect(sentContentAfter(['start', 'start-step', 'text-start', 'text-delta', 'error', 'finish-step', 'finish'])).toBe(true)
    })
})

async function runTurn({ models, fastModel, search, onModelSwitch, onModelOutcome }: {
    models: [TurnModel, ...TurnModel[]]
    fastModel?: TurnModel
    search?: () => Promise<unknown>
    onModelSwitch?: (turnModel: TurnModel) => void
    onModelOutcome?: (outcome: unknown) => void
}): ReturnType<typeof runAgentTurn> {
    return runAgentTurn({
        models,
        ...(fastModel ? { fastModel } : {}),
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'hello' }],
        tools: {
            ap_web_search: tool({ description: 'search the web', inputSchema: z.object({ query: z.string() }), execute: search ?? (async () => ({ content: [] })) }),
        },
        allToolNames: ['ap_web_search'],
        tier: TIER,
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: SILENT_LOG,
        sinks: { drainStream: drainLikeTheWorker },
        ...(onModelSwitch ? { onModelSwitch } : {}),
        ...(onModelOutcome ? { onModelOutcome } : {}),
    })
}

async function drainLikeTheWorker(result: ReturnType<typeof streamText>): Promise<StreamDrain> {
    let state: StepContentState = NO_STEP_CONTENT
    const reader = toUIMessageStream({ stream: result.stream }).getReader()
    for (let next = await reader.read(); !next.done; next = await reader.read()) {
        const chunkType = isObject(next.value) && typeof next.value['type'] === 'string' ? next.value['type'] : undefined
        state = trackStepContent({ state, chunkType })
    }
    return drainOf({ state })
}

function sentContentAfter(chunkTypes: string[]): boolean {
    return drainOf({ state: chunkTypes.reduce((state, chunkType) => trackStepContent({ state, chunkType }), NO_STEP_CONTENT) }).lastStepSentContent
}

function tierModel({ modelId, model, provider = AIProviderName.OPENAI }: { modelId: string, model: MockLanguageModelV3, provider?: AIProviderName }): TurnModel {
    return { model, provider, modelId, thinkingBudget: 0, key: { providerConfigId: `key-${modelId}`, status: 'active' } }
}

function failingModel({ statusCode }: { statusCode: number }): MockLanguageModelV3 {
    return new MockLanguageModelV3({
        doStream: async () => {
            throw new APICallError({ message: `HTTP ${statusCode}`, url: 'https://llm.example/v1', requestBodyValues: {}, statusCode, isRetryable: false })
        },
    })
}

function answeringModel(text: string, sentOptions?: SharedV3ProviderOptions[]): MockLanguageModelV3 {
    return new MockLanguageModelV3({
        doStream: async ({ providerOptions }) => {
            sentOptions?.push(providerOptions ?? {})
            return {
                stream: convertArrayToReadableStream([
                    { type: 'stream-start' as const, warnings: [] },
                    { type: 'text-start' as const, id: 't' },
                    { type: 'text-delta' as const, id: 't', delta: text },
                    { type: 'text-end' as const, id: 't' },
                    { type: 'finish' as const, finishReason: 'stop' as const, usage: USAGE },
                ]),
            }
        },
    })
}

function searchingModel(): MockLanguageModelV3 {
    return new MockLanguageModelV3({
        doStream: async () => ({
            stream: convertArrayToReadableStream([
                { type: 'stream-start' as const, warnings: [] },
                { type: 'text-start' as const, id: 't' },
                { type: 'text-delta' as const, id: 't', delta: 'Looking.' },
                { type: 'text-end' as const, id: 't' },
                { type: 'tool-call' as const, toolCallId: 'call-1', toolName: 'ap_web_search', input: '{"query":"x"}' },
                { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: USAGE },
            ]),
        }),
    })
}

function textThenFailingModel(): MockLanguageModelV3 {
    return new MockLanguageModelV3({
        doStream: async () => ({
            stream: convertArrayToReadableStream([
                { type: 'stream-start' as const, warnings: [] },
                { type: 'text-start' as const, id: 't' },
                { type: 'text-delta' as const, id: 't', delta: 'Half an ans' },
                { type: 'error' as const, error: new APICallError({ message: 'HTTP 503', url: 'https://llm.example/v1', requestBodyValues: {}, statusCode: 503, isRetryable: false }) },
            ]),
        }),
    })
}

function textOf(turn: Awaited<ReturnType<typeof runAgentTurn>>): string {
    return turn.uiParts.map((part) => isObject(part) && typeof part['text'] === 'string' ? part['text'] : '').join('')
}

const TIER = { id: 'fast', thinkingBudget: 0, modelId: 'main' }
const USAGE = { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
const SILENT_LOG = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined }
