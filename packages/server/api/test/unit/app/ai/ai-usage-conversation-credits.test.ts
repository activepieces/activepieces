import { ActivepiecesAiBillingScope, AIProviderName, apId } from '@activepieces/core-utils'
import { ReportAiUsageRequest } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addConversationCredits = vi.fn<(params: { conversationId: string, credits: number }) => Promise<void>>()
const trackBillingAndSendTelemetry = vi.fn<() => Promise<void>>()

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { getDecimalOrThrow: () => 0.0005 },
}))

vi.mock('../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({
        getOrCreateForPlatform: async () => ({ plan: 'free', licenseKey: null }),
    }),
}))

vi.mock('../../../../src/app/platform/billing-and-telemetry', () => ({
    trackBillingAndSendTelemetry: (...args: unknown[]) => trackBillingAndSendTelemetry(...args as []),
}))

vi.mock('../../../../src/app/ai/ai-usage-hooks', () => ({
    aiUsageHooks: { get: () => ({ addConversationCredits }) },
}))

const { aiUsageService } = await import('../../../../src/app/ai/ai-usage-service')

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

function reportOf(billing: ReportAiUsageRequest['billing']): ReportAiUsageRequest {
    return {
        billing,
        provider: AIProviderName.ACTIVEPIECES,
        modelId: 'anthropic/claude-sonnet-4.6',
        idempotencyKey: apId(),
        usage: { type: 'observed-cost', costUsd: 0.005 },
    }
}

describe('aiUsageService.report — the conversation credit total', () => {
    beforeEach(() => {
        addConversationCredits.mockReset()
        addConversationCredits.mockResolvedValue(undefined)
        trackBillingAndSendTelemetry.mockReset()
        trackBillingAndSendTelemetry.mockResolvedValue(undefined)
        noopLogger.warn.mockReset()
    })

    it('adds what a conversation-scoped call cost to that conversation, so a run shows its own total', async () => {
        await aiUsageService(noopLogger as never).report(reportOf({
            scope: ActivepiecesAiBillingScope.CONVERSATION,
            platformId: 'platform-1',
            projectId: 'project-1',
            conversationId: 'conversation-1',
        }))

        expect(addConversationCredits).toHaveBeenCalledWith({ conversationId: 'conversation-1', credits: 10 })
    })

    it('accumulates rather than replaces, so several calls in one turn all count', async () => {
        const billing = {
            scope: ActivepiecesAiBillingScope.CONVERSATION,
            platformId: 'platform-1',
            projectId: 'project-1',
            conversationId: 'conversation-1',
        } as const
        await aiUsageService(noopLogger as never).report(reportOf(billing))
        await aiUsageService(noopLogger as never).report(reportOf(billing))

        expect(addConversationCredits).toHaveBeenCalledTimes(2)
        expect(addConversationCredits).toHaveBeenLastCalledWith({ conversationId: 'conversation-1', credits: 10 })
    })

    it('leaves a flow run alone, since the total belongs to a conversation', async () => {
        await aiUsageService(noopLogger as never).report(reportOf({
            scope: ActivepiecesAiBillingScope.PROJECT,
            platformId: 'platform-1',
            projectId: 'project-1',
        }))

        expect(addConversationCredits).not.toHaveBeenCalled()
    })

    it('still bills when the total cannot be written, since the credit event is the money', async () => {
        addConversationCredits.mockRejectedValue(new Error('conversation is gone'))

        await aiUsageService(noopLogger as never).report(reportOf({
            scope: ActivepiecesAiBillingScope.CONVERSATION,
            platformId: 'platform-1',
            projectId: 'project-1',
            conversationId: 'conversation-1',
        }))

        expect(trackBillingAndSendTelemetry).toHaveBeenCalledTimes(1)
        expect(noopLogger.warn).toHaveBeenCalledTimes(1)
    })
})
