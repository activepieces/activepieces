import { AiUsageEvent, AiUsageModality, AiUsageSource, WorkerToApiContract } from '@activepieces/shared'
import { Logger } from 'pino'
import { describe, expect, it, vi } from 'vitest'
import { aiUsageCapture } from '../../src/lib/ai/ai-usage-capture'

function makeApiClient(reportAiUsage: (input: { engineToken: string, event: AiUsageEvent }) => Promise<void>): WorkerToApiContract {
    return { reportAiUsage } as unknown as WorkerToApiContract
}

const flowContext = {
    source: AiUsageSource.FLOW,
    provider: 'openai',
    model: 'gpt-4.1',
    flowId: 'flow-1',
    flowVersionId: 'fv-1',
    runId: 'run-1',
    stepName: 'step_1',
    actionName: 'askAi' as const,
}

function makeLogger(): Logger {
    return { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as Logger
}

describe('aiUsageCapture.buildTextEvent', () => {
    it('maps usage, tool calls and flow context into a bounded event', () => {
        const event = aiUsageCapture.buildTextEvent({
            context: flowContext,
            usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15, reasoningTokens: 2, cachedInputTokens: 4 },
            finishReason: 'stop',
            toolCalls: [{ toolName: 'search', toolCallId: 'tc-1' }],
            genParams: { temperature: 0.7 },
        })

        expect(event.source).toBe(AiUsageSource.FLOW)
        expect(event.modality).toBe(AiUsageModality.TEXT)
        expect(event.provider).toBe('openai')
        expect(event.model).toBe('gpt-4.1')
        expect(event.usage).toEqual({ inputTokens: 10, outputTokens: 5, totalTokens: 15, reasoningTokens: 2, cachedInputTokens: 4 })
        expect(event.toolCalls).toEqual([{ toolName: 'search', toolCallId: 'tc-1' }])
        expect(event.finishReason).toBe('stop')
        expect(event.context).toEqual({
            flowId: 'flow-1',
            flowVersionId: 'fv-1',
            runId: 'run-1',
            stepName: 'step_1',
            actionName: 'askAi',
        })
        expect(typeof event.idempotencyKey).toBe('string')
        expect(event.idempotencyKey.length).toBeGreaterThan(0)
    })

    it('never leaks prompts/messages/output content', () => {
        const event = aiUsageCapture.buildTextEvent({
            context: flowContext,
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            finishReason: 'stop',
        })
        const keys = Object.keys(event)
        expect(keys).not.toContain('text')
        expect(keys).not.toContain('prompt')
        expect(keys).not.toContain('messages')
        expect(keys).not.toContain('content')
    })

    it('produces a chat context with only conversationId for chat source', () => {
        const event = aiUsageCapture.buildTextEvent({
            context: { source: AiUsageSource.CHAT, provider: 'anthropic', model: 'claude', conversationId: 'conv-1' },
            usage: { inputTokens: 3, outputTokens: 4, totalTokens: 7 },
        })
        expect(event.context).toEqual({ conversationId: 'conv-1' })
    })

    it('generates a unique idempotencyKey per event', () => {
        const a = aiUsageCapture.buildTextEvent({ context: flowContext })
        const b = aiUsageCapture.buildTextEvent({ context: flowContext })
        expect(a.idempotencyKey).not.toBe(b.idempotencyKey)
    })
})

describe('aiUsageCapture.buildImageEvent', () => {
    it('reports image modality with image count and no token usage', () => {
        const event = aiUsageCapture.buildImageEvent({
            context: { ...flowContext, actionName: 'generateImage', provider: 'openai', model: 'gpt-image-1' },
            imageCount: 2,
        })
        expect(event.modality).toBe(AiUsageModality.IMAGE)
        expect(event.imageCount).toBe(2)
        expect(event.usage).toBeUndefined()
        expect(event.context?.actionName).toBe('generateImage')
    })
})

describe('aiUsageCapture.report', () => {
    it('forwards the engine token and event to the API', async () => {
        const reportAiUsage = vi.fn().mockResolvedValue(undefined)
        const apiClient = makeApiClient(reportAiUsage)
        const event = aiUsageCapture.buildTextEvent({ context: flowContext })

        aiUsageCapture.report({ apiClient, engineToken: 'engine-token-123', event, log: makeLogger() })
        await flushMicrotasks()

        expect(reportAiUsage).toHaveBeenCalledWith({ engineToken: 'engine-token-123', event })
    })

    it('swallows transport failures and logs a warning (never throws)', async () => {
        const reportAiUsage = vi.fn().mockRejectedValue(new Error('network down'))
        const apiClient = makeApiClient(reportAiUsage)
        const log = makeLogger()
        const event = aiUsageCapture.buildTextEvent({ context: flowContext })

        expect(() => aiUsageCapture.report({ apiClient, engineToken: 't', event, log })).not.toThrow()
        await flushMicrotasks()

        expect(log.warn).toHaveBeenCalled()
    })
})

function flushMicrotasks(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0))
}
