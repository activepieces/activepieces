import { ActivepiecesAiConsumerSource, AiChargeBasis, AIProviderName, AiUsageEnvironment, AiUsageOrigin } from '@activepieces/core-utils'
import { AIProviderModelMetadata, DEFAULT_MCP_DATA, ReportAiUsageRequest, RunEnvironment } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const query = vi.fn<(sql: string, params: unknown[]) => Promise<void>>()
const findOne = vi.fn<() => Promise<{ environment: RunEnvironment } | null>>()
const lookup = vi.fn<() => AIProviderModelMetadata | undefined>()

vi.mock('../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: () => () => ({ query: (sql: string, params: unknown[]) => query(sql, params) }),
}))

vi.mock('../../../../src/app/ai/ai-usage-daily-entity', () => ({
    AiUsageDailyEntity: {},
}))

vi.mock('../../../../src/app/flows/flow-run/flow-run-service', () => ({
    flowRunRepo: () => ({ findOne }),
}))

vi.mock('@activepieces/server-utils', () => ({
    modelCatalog: { load: async () => ({ lookup }) },
}))

const { aiUsageRollup } = await import('../../../../src/app/ai/ai-usage-rollup')

function chatReport(overrides: Partial<ReportAiUsageRequest> = {}, origin = AiUsageOrigin.CHAT): ReportAiUsageRequest {
    return {
        billing: {
            source: ActivepiecesAiConsumerSource.CHAT,
            platformId: 'platform-1',
            projectId: 'project-1',
            conversationId: 'conversation-1',
            chat: { userId: 'user-1', turnIndex: 0, tier: 'smart' },
            context: { origin, environment: AiUsageEnvironment.PRODUCTION, agentId: 'agent-1' },
        },
        provider: AIProviderName.OPENAI,
        providerConfigId: 'key-1',
        modelId: 'gpt-5',
        idempotencyKey: 'idem-1',
        usage: { type: AiChargeBasis.USAGE_ONLY },
        inputTokens: 1000,
        outputTokens: 200,
        ...overrides,
    }
}

async function recordedParams(input: ReportAiUsageRequest): Promise<unknown[]> {
    query.mockClear()
    await aiUsageRollup.record(input)
    return query.mock.calls[0][1]
}

describe('aiUsageRollup.record', () => {
    beforeEach(() => {
        query.mockReset()
        query.mockResolvedValue(undefined)
        lookup.mockReset()
    })

    it('takes the cost the provider reported over any estimate', async () => {
        lookup.mockReturnValue({ inputCostPerMillionTokens: 3, outputCostPerMillionTokens: 15 })

        const params = await recordedParams(chatReport({ observedCostUsd: 0.01 }))

        expect(params.slice(12)).toEqual([0, 1000, 200, 0, 0, 0, 0.01, 0])
    })

    it('estimates from list prices, charging cached tokens at the cache rate', async () => {
        lookup.mockReturnValue({ inputCostPerMillionTokens: 3, outputCostPerMillionTokens: 15, cacheReadCostPerMillionTokens: 0.3, cacheWriteCostPerMillionTokens: 3.75 })

        const params = await recordedParams(chatReport({ cacheReadTokens: 600, cacheWriteTokens: 100 }))

        expect(params[18]).toBe(0)
        expect(params[19]).toBeCloseTo(0.004455, 9)
        expect(params[12]).toBe(0)
    })

    it('counts the call as unpriced when the model has no list price', async () => {
        lookup.mockReturnValue(undefined)

        const params = await recordedParams(chatReport())

        expect([params[12], params[18], params[19]]).toEqual([1, 0, 0])
    })

    it('names the user for chat, but not for an agent step a flow ran', async () => {
        lookup.mockReturnValue(undefined)

        const chat = await recordedParams(chatReport())
        const flowStep = await recordedParams(chatReport({}, AiUsageOrigin.FLOW_AGENT_STEP))

        expect(chat[8]).toBe('user-1')
        expect(flowStep[8]).toBeNull()
        expect(flowStep[7]).toBe('agent-1')
    })

    it('drops the placeholder flow id of an action run', async () => {
        lookup.mockReturnValue(undefined)

        const params = await recordedParams({
            ...chatReport(),
            billing: {
                source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
                platformId: 'platform-1',
                projectId: 'project-1',
                flowRun: { flowId: DEFAULT_MCP_DATA.flowId, flowRunId: DEFAULT_MCP_DATA.flowRunId },
                context: { origin: AiUsageOrigin.ACTION_RUN, environment: AiUsageEnvironment.PRODUCTION },
            },
        })

        expect([params[4], params[6]]).toEqual([AiUsageOrigin.ACTION_RUN, null])
    })

    it('adds calls with the same dimensions to one row, and splits a different agent into its own', async () => {
        lookup.mockReturnValue(undefined)

        const first = await recordedParams(chatReport())
        const again = await recordedParams(chatReport())
        const otherAgent = await recordedParams({
            ...chatReport(),
            billing: { ...chatReport().billing, context: { origin: AiUsageOrigin.CHAT, environment: AiUsageEnvironment.PRODUCTION, agentId: 'agent-2' } },
        })

        expect(first[0]).toBe(again[0])
        expect(otherAgent[0]).not.toBe(first[0])
    })
})

describe('aiUsageRollup.callContextForFlowRun', () => {
    it('marks an AI piece run outside a flow as an action run without a lookup', async () => {
        findOne.mockClear()

        const context = await aiUsageRollup.callContextForFlowRun({ flowRunId: DEFAULT_MCP_DATA.flowRunId, projectId: 'project-1' })

        expect(context).toEqual({ origin: AiUsageOrigin.ACTION_RUN, environment: AiUsageEnvironment.PRODUCTION })
        expect(findOne).not.toHaveBeenCalled()
    })

    it('marks a test run as testing', async () => {
        findOne.mockResolvedValue({ environment: RunEnvironment.TESTING })

        const context = await aiUsageRollup.callContextForFlowRun({ flowRunId: 'run-1', projectId: 'project-1' })

        expect(context).toEqual({ origin: AiUsageOrigin.FLOW_STEP, environment: AiUsageEnvironment.TESTING })
    })
})
