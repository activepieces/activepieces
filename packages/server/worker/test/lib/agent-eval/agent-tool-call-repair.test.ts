import { AIProviderName } from '@activepieces/core-utils'
import { tool } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

const silentLog = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined } as never

const TIER = { id: 'fast', thinkingBudget: 5_000, modelId: 'anthropic/claude-haiku-4.5' }

const MALFORMED_INPUT = '{ query: "activepieces pricing", }'

async function turnWhereTheModelRepairsWith({ repairText, toolInput = MALFORMED_INPUT }: { repairText: string, toolInput?: string }): Promise<RepairTurn> {
    const ranWith: unknown[] = []
    const repairPrompts: string[] = []
    let streamed = 0
    const model = new MockLanguageModelV3({
        doStream: async () => {
            streamed++
            const parts = streamed === 1
                ? [
                    { type: 'stream-start' as const, warnings: [] },
                    { type: 'tool-call' as const, toolCallId: 'call-1', toolName: 'ap_web_search', input: toolInput },
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
        doGenerate: async (options) => {
            if (options.responseFormat?.type === 'json') {
                throw new Error('400 strict json_schema')
            }
            repairPrompts.push(JSON.stringify(options.prompt))
            return {
                content: [{ type: 'text' as const, text: repairText }],
                finishReason: { unified: 'stop' as const, raw: 'stop' },
                usage: { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } },
                warnings: [],
            }
        },
    })

    await runAgentTurn({
        models: [{ model, provider: AIProviderName.ANTHROPIC, modelId: TIER.modelId, thinkingBudget: TIER.thinkingBudget }],
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
        phaseState: { phase: 'discovery' },
        abortSignal: new AbortController().signal,
        log: silentLog,
    })
    return { ranWith, repairPrompts }
}

describe('repairing a tool call the model got wrong', () => {
    it('runs the tool when the model fences its corrected JSON, which is how models actually answer', async () => {
        const { ranWith } = await turnWhereTheModelRepairsWith({ repairText: '```json\n{"query":"activepieces pricing"}\n```' })

        expect(ranWith).toEqual([{ query: 'activepieces pricing' }])
    })

    it('runs the tool when the model answers with bare JSON', async () => {
        const { ranWith } = await turnWhereTheModelRepairsWith({ repairText: '{"query":"activepieces pricing"}' })

        expect(ranWith).toEqual([{ query: 'activepieces pricing' }])
    })

    it('runs the tool when the model tags the fence in caps or not at all', async () => {
        const { ranWith: upper } = await turnWhereTheModelRepairsWith({ repairText: '```JSON\n{"query":"activepieces pricing"}\n```' })
        const { ranWith: untagged } = await turnWhereTheModelRepairsWith({ repairText: '```\n{"query":"activepieces pricing"}\n```' })

        expect(upper).toEqual([{ query: 'activepieces pricing' }])
        expect(untagged).toEqual([{ query: 'activepieces pricing' }])
    })

    it('runs the tool when the model adds a sentence after the JSON', async () => {
        const { ranWith } = await turnWhereTheModelRepairsWith({ repairText: '{"query":"activepieces pricing"}\n\nLet me know if that helps!' })

        expect(ranWith).toEqual([{ query: 'activepieces pricing' }])
    })

    it('does not run the tool on text that is not JSON at all, rather than feeding it prose', async () => {
        const { ranWith } = await turnWhereTheModelRepairsWith({ repairText: 'Sure! Here is the corrected call.' })

        expect(ranWith).toEqual([])
    })

    it('repairs valid JSON whose field has the wrong type for the tool schema', async () => {
        const { ranWith, repairPrompts } = await turnWhereTheModelRepairsWith({ toolInput: '{"query":123}', repairText: '{"query":"123"}' })

        expect(ranWith).toEqual([{ query: '123' }])
        expect(repairPrompts).toEqual([expect.stringContaining('\\"query\\":{\\"type\\":\\"string\\"')])
    })

    it('does not run the tool when the repaired input still does not match the schema', async () => {
        const { ranWith } = await turnWhereTheModelRepairsWith({ toolInput: '{"query":123}', repairText: '{"query":456}' })

        expect(ranWith).toEqual([])
    })
})

type RepairTurn = {
    ranWith: unknown[]
    repairPrompts: string[]
}
