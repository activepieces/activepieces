import { AIProviderName } from '@activepieces/core-utils'
import { AgentPhase } from '@activepieces/shared'
import { streamText } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { createAgentUsageCollector } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-usage'
import { runAgentTurn, RunAgentTurnParams } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

vi.mock('ai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('ai')>()
    return { ...actual, streamText: vi.fn() }
})

const streamTextMock = vi.mocked(streamText)

type CapturedOptions = {
    onStepEnd: (event: {
        content: unknown[]
        response: { modelId: string, messages: unknown[] }
        usage: { inputTokens?: number, outputTokens?: number }
        model: { provider: string, modelId: string }
    }) => void
    onError: (event: { error: unknown }) => void
}

const makeParams = (overrides?: Partial<RunAgentTurnParams>): RunAgentTurnParams => ({
    model: {} as never,
    provider: AIProviderName.OPENAI,
    systemPrompt: 'sys',
    messages: [{ role: 'user', content: 'hi' }],
    tools: {},
    allToolNames: [],
    tier: { id: 'balanced', thinkingBudget: 0, modelId: 'auto-tier-alias' },
    phaseState: { phase: 'discovery' as AgentPhase },
    abortSignal: new AbortController().signal,
    log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    usageCollector: createAgentUsageCollector(),
    ...overrides,
})

const successResult = ({ text, inputTokens, outputTokens }: { text: string, inputTokens: number, outputTokens: number }) => ({
    steps: Promise.resolve([{ response: { messages: [{ role: 'assistant', content: text }] } }]),
    usage: Promise.resolve({ inputTokens, outputTokens }),
    finishReason: Promise.resolve('stop'),
    finalStep: Promise.resolve({ performance: { stepTimeMs: 1, responseTimeMs: 1 } }),
}) as never

describe('runAgentTurn — usage records the served model id, not the requested alias', () => {
    it('records response.modelId per step so pricing keys on the concrete model', async () => {
        streamTextMock.mockImplementationOnce(((options: CapturedOptions) => {
            options.onStepEnd({
                content: [{ type: 'text', text: 'done' }],
                response: { modelId: 'gpt-4o-2024-11-20', messages: [{ role: 'assistant', content: 'done' }] },
                usage: { inputTokens: 100, outputTokens: 20 },
                model: { provider: 'openai', modelId: 'auto-tier-alias' },
            })
            return successResult({ text: 'done', inputTokens: 100, outputTokens: 20 })
        }) as never)

        const usageCollector = createAgentUsageCollector()
        await runAgentTurn(makeParams({ usageCollector }))

        expect(usageCollector.snapshot()).toEqual({
            version: 1,
            calls: [{ provider: 'openai', model: 'gpt-4o-2024-11-20', inputTokens: 100, outputTokens: 20 }],
            totals: { inputTokens: 100, outputTokens: 20 },
        })
    })
})

describe('runAgentTurn — a retried first attempt keeps the incomplete flag', () => {
    it('marks the totals a lower bound when attempt one died mid-turn, even though the retry succeeded', async () => {
        streamTextMock
            .mockImplementationOnce(((options: CapturedOptions) => {
                options.onStepEnd({
                    content: [],
                    response: { modelId: 'gpt-4o-2024-11-20', messages: [{ role: 'assistant', content: '' }] },
                    usage: { inputTokens: 40, outputTokens: 5 },
                    model: { provider: 'openai', modelId: 'auto-tier-alias' },
                })
                options.onError({ error: new Error('the provider dropped the stream') })
                return {} as never
            }) as never)
            .mockImplementationOnce(((options: CapturedOptions) => {
                options.onStepEnd({
                    content: [{ type: 'text', text: 'recovered' }],
                    response: { modelId: 'gpt-4o-2024-11-20', messages: [{ role: 'assistant', content: 'recovered' }] },
                    usage: { inputTokens: 60, outputTokens: 10 },
                    model: { provider: 'openai', modelId: 'auto-tier-alias' },
                })
                return successResult({ text: 'recovered', inputTokens: 60, outputTokens: 10 })
            }) as never)

        const usageCollector = createAgentUsageCollector()
        const turn = await runAgentTurn(makeParams({ usageCollector }))

        expect(turn.streamError).toBeNull()
        expect(usageCollector.snapshot()).toEqual({
            version: 1,
            calls: [
                { provider: 'openai', model: 'gpt-4o-2024-11-20', inputTokens: 40, outputTokens: 5 },
                { provider: 'openai', model: 'gpt-4o-2024-11-20', inputTokens: 60, outputTokens: 10 },
            ],
            totals: { inputTokens: 100, outputTokens: 15 },
            incomplete: true,
        })
    })
})
