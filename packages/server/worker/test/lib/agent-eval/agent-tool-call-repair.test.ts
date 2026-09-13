import { AIProviderName } from '@activepieces/core-utils'
import { tool } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

const silentLog = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined } as never

const TIER = { id: 'fast', thinkingBudget: 5_000, modelId: 'anthropic/claude-haiku-4.5' }

const MALFORMED_INPUT = '{ query: "activepieces pricing", }'

async function turnWhereTheModelRepairsWith(repairText: string): Promise<{ ranWith: unknown[] }> {
    const ranWith: unknown[] = []
    let streamed = 0
    const model = new MockLanguageModelV3({
        doStream: async () => {
            streamed++
            const parts = streamed === 1
                ? [
                    { type: 'stream-start' as const, warnings: [] },
                    { type: 'tool-call' as const, toolCallId: 'call-1', toolName: 'ap_web_search', input: MALFORMED_INPUT },
                    { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                ]
                : [
                    { type: 'stream-start' as const, warnings: [] },
                    { type: 'text-start' as const, id: 't' },
                    { type: 'text-delta' as const, id: 't', delta: 'done' },
                    { type: 'text-end' as const, id: 't' },
                    { type: 'finish' as const, finishReason: 'stop' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                ]
            return { stream: convertArrayToReadableStream(parts) }
        },
        doGenerate: async () => ({
            content: [{ type: 'text' as const, text: repairText }],
            finishReason: 'stop' as const,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            warnings: [],
        }),
    })

    await runAgentTurn({
        model,
        provider: AIProviderName.ANTHROPIC,
        systemPrompt: 'You are a test agent.',
        messages: [{ role: 'user', content: 'search the web' }],
        tools: {
            ap_web_search: tool({
                description: 'search the web',
                inputSchema: z.object({ query: z.string() }),
                execute: async (input: unknown) => {
                    ranWith.push(input)
                    return { content: [{ type: 'text', text: 'ok' }] }
                },
            }),
        } as never,
        allToolNames: ['ap_web_search'],
        tier: TIER,
        modelId: TIER.modelId,
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: silentLog,
    })
    return { ranWith }
}

describe('repairing a tool call the model got wrong', () => {
    it('runs the tool when the model fences its corrected JSON, which is how models actually answer', async () => {
        const { ranWith } = await turnWhereTheModelRepairsWith('```json\n{"query":"activepieces pricing"}\n```')

        expect(ranWith).toEqual([{ query: 'activepieces pricing' }])
    })

    it('runs the tool when the model answers with bare JSON', async () => {
        const { ranWith } = await turnWhereTheModelRepairsWith('{"query":"activepieces pricing"}')

        expect(ranWith).toEqual([{ query: 'activepieces pricing' }])
    })

    it('does not run the tool on text that is not JSON at all, rather than feeding it prose', async () => {
        const { ranWith } = await turnWhereTheModelRepairsWith('Sure! Here is the corrected call.')

        expect(ranWith).toEqual([])
    })
})
