import { AIProviderName, spreadIfDefined } from '@activepieces/core-utils'
import { PersistedAgentPartType, PersistedToolCallStatus } from '@activepieces/shared'
import { tool } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

describe('a turn that runs out of credits', () => {
    it('stops after the step that took the balance below zero, instead of running every step', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const creditsLeft = vi.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(5).mockResolvedValue(-1)

        const turn = await runTurn({ search, creditsLeft })

        expect(search).toHaveBeenCalledTimes(3)
        expect(turn.creditsExhausted).toBe(true)
    })

    it('asks with what the turn has used so far, so credits the turn has not been billed yet still count', async () => {
        const creditsLeft = vi.fn().mockResolvedValueOnce(5).mockResolvedValue(-1)

        await runTurn({ search: async () => SEARCH_RESULT, creditsLeft })

        expect(creditsLeft.mock.calls).toEqual([[2], [3]])
    })

    it('lets the agent answer on an exact balance, but without the paid tools', async () => {
        const model = alwaysSearchingModel()

        const turn = await runTurn({ search: async () => SEARCH_RESULT, creditsLeft: async () => 0, stepCeiling: 2, model })

        const [firstStep, ...laterSteps] = model.doStreamCalls.map((call) => call.tools?.map((t) => t.name))
        expect(firstStep).toEqual(['ap_web_search', 'ap_fetch_url'])
        expect(laterSteps.length).toBeGreaterThan(0)
        expect(laterSteps.every((names) => names?.join() === 'ap_fetch_url')).toBe(true)
        expect(turn.creditsExhausted).toBe(false)
        const searchStatuses = turn.uiParts.flatMap((part) => part.type === PersistedAgentPartType.TOOL_CALL ? [part.status] : [])
        expect(searchStatuses[0]).toBe(PersistedToolCallStatus.COMPLETED)
        expect(searchStatuses.slice(1).every((status) => status === PersistedToolCallStatus.ERROR)).toBe(true)
    })

    it('keeps going when the credit check itself fails', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)

        const turn = await runTurn({ search, creditsLeft: failingCreditCheck, stepCeiling: 5 })

        expect(search.mock.calls.length).toBeGreaterThan(3)
        expect(turn.creditsExhausted).toBe(false)
    })
})

describe('a turn with many steps', () => {
    it('ends a saved agent\'s step budget with a reply instead of a silent stop', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)
        const model = searchUntilToldToAnswer({ searches: 10 })

        const turn = await runTurn({ search, creditsLeft: async () => 100, stepCeiling: 3, model, drainsStream: true })

        const toolChoices = model.doStreamCalls.map((call) => call.toolChoice?.type)
        expect(search).toHaveBeenCalledTimes(2)
        expect(toolChoices.at(-1)).toBe('none')
        expect(turn.uiParts.at(-1)?.type).toBe(PersistedAgentPartType.TEXT)
    })

    it('lets chat finish a long job, since credits, time and context already bound the turn', async () => {
        const search = vi.fn(async () => SEARCH_RESULT)

        await runTurn({ search, creditsLeft: async () => 1_000, stepCeiling: null, model: searchUntilToldToAnswer({ searches: 60 }), drainsStream: true })

        expect(search).toHaveBeenCalledTimes(60)
    })
})

async function runTurn({ search, creditsLeft, stepCeiling = 20, model = alwaysSearchingModel(), drainsStream = false }: {
    search: () => Promise<unknown>
    creditsLeft: (pendingCredits: number) => Promise<number | null>
    stepCeiling?: number | null
    model?: MockLanguageModelV3
    drainsStream?: boolean
}): ReturnType<typeof runAgentTurn> {
    return runAgentTurn({
        model,
        provider: AIProviderName.ANTHROPIC,
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'research this' }],
        tools: {
            ap_web_search: tool({ description: 'search the web', inputSchema: z.object({ query: z.string() }), execute: search }),
            ap_fetch_url: tool({ description: 'read a page', inputSchema: z.object({ url: z.string() }), execute: async () => SEARCH_RESULT }),
        },
        allToolNames: ['ap_web_search', 'ap_fetch_url'],
        tier: TIER,
        modelId: TIER.modelId,
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: SILENT_LOG,
        ...spreadIfDefined('stepCeiling', stepCeiling ?? undefined),
        ...(drainsStream ? { sinks: { drainStream: (result) => result.consumeStream() } } : {}),
        creditsLeft,
    })
}

async function failingCreditCheck(): Promise<number | null> {
    throw new Error('rpc down')
}

function alwaysSearchingModel(): MockLanguageModelV3 {
    let calls = 0
    return new MockLanguageModelV3({
        doStream: async () => {
            calls++
            return {
                stream: convertArrayToReadableStream([
                    { type: 'stream-start' as const, warnings: [] },
                    { type: 'tool-call' as const, toolCallId: `call-${calls}`, toolName: 'ap_web_search', input: '{"query":"more"}' },
                    { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                ]),
            }
        },
    })
}

function searchUntilToldToAnswer({ searches }: { searches: number }): MockLanguageModelV3 {
    let calls = 0
    return new MockLanguageModelV3({
        doStream: async ({ toolChoice }) => {
            calls++
            const answers = toolChoice?.type === 'none' || calls > searches
            return {
                stream: convertArrayToReadableStream(answers
                    ? [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'text-start' as const, id: 'answer' },
                        { type: 'text-delta' as const, id: 'answer', delta: 'Here is what I found so far.' },
                        { type: 'text-end' as const, id: 'answer' },
                        { type: 'finish' as const, finishReason: 'stop' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                    ]
                    : [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'tool-call' as const, toolCallId: `call-${calls}`, toolName: 'ap_web_search', input: '{"query":"more"}' },
                        { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                    ]),
            }
        },
    })
}

const SEARCH_RESULT = { content: [{ type: 'text', text: 'ok' }] }

const TIER = { id: 'fast', thinkingBudget: 5_000, modelId: 'anthropic/claude-haiku-4.5' }

const SILENT_LOG = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined }
