import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, AiChargeBasis, AIProviderName, AiUsageEnvironment, AiUsageOrigin, apId } from '@activepieces/core-utils'
import { DEFAULT_MCP_DATA, ReportAiUsageRequest } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { getDecimalOrThrow: () => 0.0005 },
}))

vi.mock('@activepieces/server-utils', () => ({
    modelCatalog: {
        load: async () => ({
            lookup: ({ modelId }: { modelId: string }) => modelId === 'gpt-5'
                ? { inputCostPerMillionTokens: 1, outputCostPerMillionTokens: 10, cacheReadCostPerMillionTokens: 0.1 }
                : undefined,
        }),
    },
}))

vi.mock('../../../../src/app/database/redis-connections', () => ({ distributedStore: {} }))
vi.mock('../../../../src/app/flows/flow-run/flow-run-service', () => ({ flowRunRepo: () => ({}) }))

const { aiUsageEvent } = await import('../../../../src/app/ai/usage/ai-usage-event')

const RUN_ID = apId()

const STEP_BILLING: ActivepiecesAiBilling = {
    source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
    platformId: 'platform-1',
    projectId: 'project-1',
    flowRun: { flowId: 'flow-1', flowRunId: RUN_ID },
    context: { origin: AiUsageOrigin.FLOW_STEP, environment: AiUsageEnvironment.PRODUCTION, flowRunId: RUN_ID, flowId: 'flow-1' },
}

function report(overrides: Partial<ReportAiUsageRequest>): ReportAiUsageRequest {
    return {
        billing: STEP_BILLING,
        provider: AIProviderName.OPENAI,
        modelId: 'gpt-5',
        idempotencyKey: apId(),
        usage: { type: AiChargeBasis.FIXED_CREDITS, credits: 1 },
        ...overrides,
    }
}

describe('aiUsageEvent.blockOf', () => {
    it('prices a managed call at what we bill, exactly', async () => {
        const event = await aiUsageEvent.blockOf(report({ provider: AIProviderName.ACTIVEPIECES, usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.002 } }))
        expect(event).toMatchObject({ v: 1, reportedCostUsd: 0.002, estimatedCostUsd: 0, managedCredits: 4, unpriced: false })
    })

    it('prices a managed fixed-credit call (image) at credits times the credit value', async () => {
        const event = await aiUsageEvent.blockOf(report({ provider: AIProviderName.ACTIVEPIECES, usage: { type: AiChargeBasis.FIXED_CREDITS, credits: 1 } }))
        expect(event).toMatchObject({ reportedCostUsd: 0.0005, managedCredits: 1 })
    })

    it('keeps the cost an own-key gateway reported and leaves the estimate at zero', async () => {
        const event = await aiUsageEvent.blockOf(report({ observedCostUsd: 0.01, inputTokens: 1000 }))
        expect(event).toMatchObject({ reportedCostUsd: 0.01, estimatedCostUsd: 0, managedCredits: 0 })
    })

    it('estimates an own-key call from list prices, with cache reads at their own rate', async () => {
        const event = await aiUsageEvent.blockOf(report({ inputTokens: 1_000_000, cacheReadTokens: 400_000, outputTokens: 100_000 }))
        expect(event.estimatedCostUsd).toBeCloseTo(0.6 + 0.04 + 1, 6)
        expect(event.reportedCostUsd).toBe(0)
        expect(event.unpriced).toBe(false)
    })

    it('marks a call unpriced when the model has no list price', async () => {
        const event = await aiUsageEvent.blockOf(report({ modelId: 'mystery-model', inputTokens: 10 }))
        expect(event).toMatchObject({ reportedCostUsd: 0, estimatedCostUsd: 0, unpriced: true })
    })

    it('keeps the user only for chat and agent calls', async () => {
        const chat = await aiUsageEvent.blockOf(report({
            billing: { source: ActivepiecesAiConsumerSource.CHAT, platformId: 'platform-1', projectId: null, conversationId: 'c-1', context: { origin: AiUsageOrigin.CHAT, environment: AiUsageEnvironment.PRODUCTION } },
            chat: { userId: 'user-1', turnIndex: 0, tier: 'standard' },
        }))
        expect(chat.userId).toBe('user-1')
        const step = await aiUsageEvent.blockOf(report({ chat: { userId: 'user-1', turnIndex: 0, tier: 'standard' } }))
        expect(step.userId).toBeNull()
    })

    it('takes the user from the call context for internal agent calls that carry no chat info', async () => {
        const event = await aiUsageEvent.blockOf(report({
            billing: { source: ActivepiecesAiConsumerSource.CHAT, platformId: 'platform-1', projectId: 'project-1', conversationId: 'c-2', context: { origin: AiUsageOrigin.AGENT, environment: AiUsageEnvironment.PRODUCTION, agentId: 'agent-1', userId: 'user-9' } },
            usage: { type: AiChargeBasis.USAGE_ONLY },
        }))
        expect(event).toMatchObject({ userId: 'user-9', agentId: 'agent-1' })
    })

    it('drops the placeholder flow of an action run and never counts it as a run', async () => {
        const event = await aiUsageEvent.blockOf(report({
            billing: { ...STEP_BILLING, flowRun: { flowId: DEFAULT_MCP_DATA.flowId, flowRunId: DEFAULT_MCP_DATA.flowRunId }, context: { origin: AiUsageOrigin.ACTION_RUN, environment: AiUsageEnvironment.PRODUCTION } },
        }))
        expect(event.flowId).toBeNull()
        expect(event.runId).toBeNull()
    })

    it('counts a run only for flow steps with a real run id', async () => {
        expect((await aiUsageEvent.blockOf(report({}))).runId).toBe(RUN_ID)
    })

    it('bills nothing for a managed usage-only call, even with tool calls', async () => {
        const event = await aiUsageEvent.blockOf(report({ provider: AIProviderName.ACTIVEPIECES, usage: { type: AiChargeBasis.USAGE_ONLY }, toolCalls: 3, observedCostUsd: 0.02 }))
        expect(event).toMatchObject({ reportedCostUsd: 0, estimatedCostUsd: 0, managedCredits: 0, unpriced: false })
    })

    it('keeps the own-key cost of a usage-only call, since the customer pays their provider', async () => {
        const event = await aiUsageEvent.blockOf(report({ usage: { type: AiChargeBasis.USAGE_ONLY }, toolCalls: 2, observedCostUsd: 0.03 }))
        expect(event).toMatchObject({ reportedCostUsd: 0.03, managedCredits: 0 })
    })

    it('gives the same series to the same dimensions, whether ids are null or missing', () => {
        const block = { projectId: null, flowId: null, agentId: null, userId: null, provider: AIProviderName.OPENAI, providerConfigId: null, modelId: 'gpt-5', origin: AiUsageOrigin.CHAT, environment: AiUsageEnvironment.PRODUCTION }
        expect(aiUsageEvent.seriesIdOf({ platformId: 'p', block })).toHaveLength(32)
        expect(aiUsageEvent.seriesIdOf({ platformId: 'p', block })).toBe(aiUsageEvent.seriesIdOf({ platformId: 'p', block: { ...block } }))
        expect(aiUsageEvent.seriesIdOf({ platformId: 'p', block })).not.toBe(aiUsageEvent.seriesIdOf({ platformId: 'p', block: { ...block, environment: AiUsageEnvironment.TESTING } }))
        expect(aiUsageEvent.seriesIdOf({ platformId: 'p', block })).not.toBe(aiUsageEvent.seriesIdOf({ platformId: 'q', block }))
    })
})
