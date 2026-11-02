import { ActivepiecesAiConsumerSource, AiChargeBasis, AIProviderName, AiUsageEnvironment, AiUsageOrigin, apId } from '@activepieces/core-utils'
import { ConsumableFeatureId, ReportAiUsageRequest } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiUsageBlock } from '../../../../src/app/ai/usage/ai-usage-block'

const trackBillingAndSendTelemetry = vi.fn<(params: { credits: { properties: Record<string, unknown> } }) => Promise<void>>()
const trackFeature = vi.fn<(params: unknown) => Promise<void>>()
const blockOf = vi.fn<(input: ReportAiUsageRequest) => Promise<AiUsageBlock>>()

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { getDecimalOrThrow: () => 0.0005 },
}))

vi.mock('../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({
        getOrCreateForPlatform: async () => ({ plan: 'free', licenseKey: null }),
    }),
}))

vi.mock('../../../../src/app/platform/billing-and-telemetry', () => ({
    trackBillingAndSendTelemetry: (params: { credits: { properties: Record<string, unknown> } }) => trackBillingAndSendTelemetry(params),
}))

vi.mock('../../../../src/app/platform/billing-provider', async (importOriginal) => ({
    ...await importOriginal<Record<string, unknown>>(),
    billingProvider: { get: () => ({ trackFeature }) },
}))

vi.mock('../../../../src/app/ai/usage/ai-usage-event', () => ({
    aiUsageEvent: { blockOf: (input: ReportAiUsageRequest) => blockOf(input) },
}))

vi.mock('../../../../src/app/database/redis-connections', () => ({
    distributedStore: { runOnceWithin: async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn() },
}))

vi.mock('../../../../src/app/ai/ai-usage-hooks', () => ({
    aiUsageHooks: { get: () => ({ addConversationCredits: vi.fn() }) },
}))

const { aiUsageService } = await import('../../../../src/app/ai/ai-usage-service')

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const BLOCK: AiUsageBlock = {
    v: 1,
    origin: AiUsageOrigin.FLOW_STEP,
    environment: AiUsageEnvironment.TESTING,
    projectId: 'project-1',
    flowId: 'flow-1',
    agentId: null,
    userId: null,
    runId: null,
    provider: AIProviderName.OPENAI,
    providerConfigId: 'key-1',
    modelId: 'gpt-5',
    inputTokens: 100,
    outputTokens: 20,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    reportedCostUsd: 0,
    estimatedCostUsd: 0.001,
    managedCredits: 0,
    unpriced: false,
}

function stepReport(usage: ReportAiUsageRequest['usage']): ReportAiUsageRequest {
    return {
        billing: {
            source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
            platformId: 'platform-1',
            projectId: 'project-1',
            flowRun: { flowId: 'flow-1', flowRunId: 'run-1' },
        },
        provider: AIProviderName.OPENAI,
        modelId: 'gpt-5',
        idempotencyKey: apId(),
        usage,
        toolCalls: 2,
    }
}

describe('aiUsageService.report — the usage block on Autumn events', () => {
    beforeEach(() => {
        trackBillingAndSendTelemetry.mockReset()
        trackBillingAndSendTelemetry.mockResolvedValue(undefined)
        trackFeature.mockReset()
        trackFeature.mockResolvedValue(undefined)
        blockOf.mockReset()
        blockOf.mockResolvedValue(BLOCK)
    })

    it('adds the usage block to a billed call and keeps every billing property', async () => {
        await aiUsageService(noopLogger as never).report(stepReport({ type: AiChargeBasis.FIXED_CREDITS, credits: 1 }))

        const properties = trackBillingAndSendTelemetry.mock.calls[0][0].credits.properties
        expect(properties).toMatchObject({ platformId: 'platform-1', projectId: 'project-1', usage: BLOCK })
        expect(trackFeature).not.toHaveBeenCalled()
    })

    it('records a usage-only call as a zero-value credits event that carries only its usage block', async () => {
        const report = stepReport({ type: AiChargeBasis.USAGE_ONLY })
        await aiUsageService(noopLogger as never).report(report)

        expect(trackFeature).toHaveBeenCalledWith({
            featureId: ConsumableFeatureId.AP_CREDITS,
            platformId: 'platform-1',
            value: 0,
            idempotencyKey: report.idempotencyKey,
            source: 'ai_usage',
            properties: { usage: BLOCK },
        })
        expect(trackBillingAndSendTelemetry).not.toHaveBeenCalled()
    })

    it('still bills a call whose usage block could not be built', async () => {
        blockOf.mockRejectedValue(new Error('catalog unreachable'))
        await aiUsageService(noopLogger as never).report(stepReport({ type: AiChargeBasis.FIXED_CREDITS, credits: 1 }))

        const properties = trackBillingAndSendTelemetry.mock.calls[0][0].credits.properties
        expect(properties).not.toHaveProperty('usage')
        expect(properties).toMatchObject({ platformId: 'platform-1', projectId: 'project-1' })
    })

    it('sends nothing for a usage-only call whose block could not be built', async () => {
        blockOf.mockRejectedValue(new Error('catalog unreachable'))
        await aiUsageService(noopLogger as never).report(stepReport({ type: AiChargeBasis.USAGE_ONLY }))

        expect(trackFeature).not.toHaveBeenCalled()
        expect(trackBillingAndSendTelemetry).not.toHaveBeenCalled()
    })
})
