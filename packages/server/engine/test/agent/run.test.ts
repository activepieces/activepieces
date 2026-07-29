import { AIProviderName } from '@activepieces/core-utils'
import { AgentStreamChunk } from '@activepieces/pieces-framework'
import { simulateReadableStream } from 'ai/test'
import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { agentRunner } from '../../src/lib/agent/run'

const COMPLETION_TOOL = 'updateTaskStatus'

function textModel(chunks: string[], finishReason = 'stop') {
    return new MockLanguageModelV3({
        doStream: async () => ({
            stream: simulateReadableStream({
                chunks: [
                    { type: 'stream-start', warnings: [] },
                    { type: 'text-start', id: '0' },
                    ...chunks.map((text) => ({ type: 'text-delta' as const, id: '0', delta: text })),
                    { type: 'text-end', id: '0' },
                    { type: 'finish', finishReason: { unified: finishReason, raw: finishReason }, usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 } },
                ],
            }),
        }),
    })
}

async function runWith(model: MockLanguageModelV3, maxSteps = 5) {
    const chunks: AgentStreamChunk[] = []
    const result = await agentRunner.run({
        model,
        provider: AIProviderName.OPENAI,
        system: 'you are a test agent',
        prompt: 'do the thing',
        tools: {},
        maxSteps,
        stopOnToolName: COMPLETION_TOOL,
        onChunk: (chunk) => {
            chunks.push(chunk)
        },
    })
    return { result, chunks }
}

describe('agentRunner.run', () => {
    it('streams every chunk to onChunk and reports produced text', async () => {
        const { result, chunks } = await runWith(textModel(['Hello', ' world']))

        const text = chunks
            .filter((chunk) => chunk.type === 'text-delta')
            .map((chunk) => 'text' in chunk ? chunk.text : '')
            .join('')

        expect(text).toBe('Hello world')
        expect(result.streamError).toBeNull()
        expect(result.truncatedAfterRetries).toBe(false)
    })

    it('reports truncation after exhausting auto-continuations instead of silently stopping', async () => {
        const { result } = await runWith(textModel(['partial'], 'length'))

        expect(result.truncatedAfterRetries).toBe(true)
        expect(result.continuations).toBeGreaterThan(0)
    })

    it('surfaces a stream error rather than throwing', async () => {
        const failing = new MockLanguageModelV3({
            doStream: async () => {
                throw new Error('provider exploded')
            },
        })

        const { result, chunks } = await runWith(failing)

        expect(result.streamError).toBeInstanceOf(Error)
        expect(chunks.filter((chunk) => chunk.type === 'text-delta')).toHaveLength(0)
    })
})
