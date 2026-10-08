import { AIProviderName } from '@activepieces/core-utils'
import { ModelMessage, tool } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { runAgentTurn } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

describe('the history a turn leaves behind', () => {
    it('keeps the tool call and its result, so the next turn knows the change was made by a tool', async () => {
        const progress: ModelMessage[][] = []

        const turn = await runAgentTurn({
            models: [{ model: updateThenConfirm(), provider: AIProviderName.ANTHROPIC, modelId: TIER.modelId, thinkingBudget: TIER.thinkingBudget }],
            systemPrompt: 'You are a test agent.',
            messages: [{ role: 'user', content: 'Change the instructions of New agent to: Reply in Arabic.' }],
            tools: {
                ap_update_agent: tool({ description: 'change an agent', inputSchema: z.object({ instructions: z.string() }), execute: async () => ({ saved: true }) }),
            },
            allToolNames: ['ap_update_agent'],
            tier: TIER,
            phaseState: { phase: 'build' },
            abortSignal: new AbortController().signal,
            log: SILENT_LOG,
            creditsLeft: async () => 100,
            sinks: {
                drainStream: async (result) => { await result.consumeStream(); return undefined },
                onProgress: ({ responseMessages }) => progress.push(responseMessages),
            },
        })

        expect(rolesAndParts(turn.accumulatedResponseMessages)).toEqual(['assistant:tool-call', 'tool:tool-result', 'assistant:text'])
        expect(rolesAndParts(progress[progress.length - 1])).toEqual(['assistant:tool-call', 'tool:tool-result', 'assistant:text'])
    })

    it('keeps every finished step when the turn is cancelled partway, not just the last one', async () => {
        const controller = new AbortController()
        let saves = 0

        const turn = await runAgentTurn({
            models: [{ model: keepsUpdating(), provider: AIProviderName.ANTHROPIC, modelId: TIER.modelId, thinkingBudget: TIER.thinkingBudget }],
            systemPrompt: 'You are a test agent.',
            messages: [{ role: 'user', content: 'Update New agent three times.' }],
            tools: {
                ap_update_agent: tool({
                    description: 'change an agent',
                    inputSchema: z.object({ instructions: z.string() }),
                    execute: async () => {
                        saves++
                        if (saves === 3) {
                            controller.abort()
                        }
                        return { saved: true }
                    },
                }),
            },
            allToolNames: ['ap_update_agent'],
            tier: TIER,
            phaseState: { phase: 'build' },
            abortSignal: controller.signal,
            log: SILENT_LOG,
            creditsLeft: async () => 100,
            sinks: { drainStream: async (result) => { await result.consumeStream(); return undefined } },
        })

        const toolCalls = turn.accumulatedResponseMessages.flatMap((message) => typeof message.content === 'string'
            ? []
            : message.content.flatMap((part) => part.type === 'tool-call' ? [part.toolCallId] : []))
        expect(toolCalls).toEqual(['update-1', 'update-2'])
    })
})

function rolesAndParts(messages: ModelMessage[]): string[] {
    return messages.flatMap((message) => typeof message.content === 'string'
        ? [`${message.role}:text`]
        : message.content.map((part) => `${message.role}:${part.type}`))
}

function updateThenConfirm(): MockLanguageModelV3 {
    let calls = 0
    return new MockLanguageModelV3({
        doStream: async () => {
            calls++
            return {
                stream: convertArrayToReadableStream(calls === 1
                    ? [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'tool-call' as const, toolCallId: 'update-1', toolName: 'ap_update_agent', input: '{"instructions":"Reply in Arabic."}' },
                        { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                    ]
                    : [
                        { type: 'stream-start' as const, warnings: [] },
                        { type: 'text-start' as const, id: 'done' },
                        { type: 'text-delta' as const, id: 'done', delta: 'Done, New agent now replies in Arabic.' },
                        { type: 'text-end' as const, id: 'done' },
                        { type: 'finish' as const, finishReason: 'stop' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                    ]),
            }
        },
    })
}

const TIER = { id: 'fast', thinkingBudget: 5_000, modelId: 'anthropic/claude-haiku-4.5' }

const SILENT_LOG = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined }

function keepsUpdating(): MockLanguageModelV3 {
    let calls = 0
    return new MockLanguageModelV3({
        doStream: async () => {
            calls++
            return {
                stream: convertArrayToReadableStream([
                    { type: 'stream-start' as const, warnings: [] },
                    { type: 'tool-call' as const, toolCallId: `update-${calls}`, toolName: 'ap_update_agent', input: '{"instructions":"again"}' },
                    { type: 'finish' as const, finishReason: 'tool-calls' as const, usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
                ]),
            }
        },
    })
}
