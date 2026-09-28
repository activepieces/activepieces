import { AIProviderName } from '@activepieces/core-utils'
import { tool } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

describe('a turn that runs out of credits', () => {
    it('stops after the step where the credits ran out, instead of running every step', async () => {
        const search = vi.fn(async () => ({ content: [{ type: 'text', text: 'ok' }] }))
        const hasCredits = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValue(false)

        const turn = await runTurn({ search, hasCredits })

        expect(search).toHaveBeenCalledTimes(3)
        expect(turn.creditsExhausted).toBe(true)
    })

    it('keeps going when the credit check itself fails', async () => {
        const search = vi.fn(async () => ({ content: [{ type: 'text', text: 'ok' }] }))

        const turn = await runTurn({ search, hasCredits: failingCreditCheck, stepCeiling: 5 })

        expect(search.mock.calls.length).toBeGreaterThan(3)
        expect(turn.creditsExhausted).toBe(false)
    })
})

async function runTurn({ search, hasCredits, stepCeiling = 20 }: { search: () => Promise<unknown>, hasCredits: () => Promise<boolean>, stepCeiling?: number }): ReturnType<typeof runAgentTurn> {
    return runAgentTurn({
        model: alwaysSearchingModel(),
        provider: AIProviderName.ANTHROPIC,
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'research this' }],
        tools: { ap_web_search: tool({ description: 'search the web', inputSchema: z.object({ query: z.string() }), execute: search }) },
        allToolNames: ['ap_web_search'],
        tier: TIER,
        modelId: TIER.modelId,
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: SILENT_LOG,
        stepCeiling,
        hasCredits,
    })
}

async function failingCreditCheck(): Promise<boolean> {
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

const TIER = { id: 'fast', thinkingBudget: 5_000, modelId: 'anthropic/claude-haiku-4.5' }

const SILENT_LOG = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined }
