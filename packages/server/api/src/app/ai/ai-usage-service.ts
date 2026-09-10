import { ActivepiecesAiBilling, ActivepiecesAiBillingScope, ActivepiecesAiCostEvent, AIProviderName, isNil, spreadIfNotUndefined } from '@activepieces/core-utils'
import { isAppSumoCreditedPlan } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { LicenseKeyPostHogEvents } from '../helper/telemetry.utils'
import { trackBillingAndSendTelemetry } from '../platform/billing-and-telemetry'
import { AiCallCreditConsumptionProperties, CreditUsageSource } from '../platform/billing-provider'

export const aiUsageService = (log: FastifyBaseLogger) => ({
    async reportActivepiecesAiCost({ billing, provider, modelId, call }: ActivepiecesAiCostEvent): Promise<void> {
        const { platformId, projectId, conversationId } = toBillingTarget(billing)
        await aiUsageService(log).reportActivepiecesAiCall({
            platformId,
            projectId,
            provider,
            model: modelId,
            generationId: call.generationId,
            costUsd: call.costUsd,
            ...spreadIfNotUndefined('inputTokens', call.inputTokens),
            ...spreadIfNotUndefined('outputTokens', call.outputTokens),
            ...spreadIfNotUndefined('conversationId', conversationId),
        })
    },

    async reportActivepiecesAiCall({ platformId, projectId, provider, model, generationId, costUsd, inputTokens, outputTokens, flowId, flowRunId, conversationId }: ReportActivepiecesAiCallParams): Promise<void> {
        if (provider !== AIProviderName.ACTIVEPIECES) {
            log.warn({ platform: { id: platformId }, project: { id: projectId }, provider }, '[aiUsageService#reportActivepiecesAiCall] Refused a cost report for a provider we do not pay for')
            return
        }
        const credits = toCredits(costUsd)
        const properties: AiCallCreditConsumptionProperties = {
            platformId,
            projectId,
            provider,
            model,
            generationId,
            costUsd,
            ...spreadIfNotUndefined('inputTokens', inputTokens),
            ...spreadIfNotUndefined('outputTokens', outputTokens),
            ...spreadIfNotUndefined('flowId', flowId),
            ...spreadIfNotUndefined('flowRunId', flowRunId),
            ...spreadIfNotUndefined('conversationId', conversationId),
        }
        if (credits === 0) {
            log.info({ platform: { id: platformId }, project: { id: projectId }, model, costUsd }, '[aiUsageService#reportActivepiecesAiCall] The Activepieces provider call cost nothing, so nothing was deducted')
            return
        }
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const isAppSumoPlan = isAppSumoCreditedPlan(platformPlan.plan)
        await trackBillingAndSendTelemetry({
            log,
            licenseKey: platformPlan.licenseKey,
            credits: {
                platformId,
                value: credits,
                source: CreditUsageSource.AI,
                idempotencyKey: `${generationId}:ai`,
                properties,
            },
            appSumo: isAppSumoPlan ? {
                platformId,
                value: credits,
                source: CreditUsageSource.AI,
                idempotencyKey: `${generationId}:appSumoAi`,
                properties,
            } : undefined,
            telemetry: {
                event: LicenseKeyPostHogEvents.AI_USAGE_PER_CALL,
                properties: {
                    platformId,
                    projectId,
                    edition: system.getEdition(),
                    provider,
                    model,
                    costUsd,
                    credits,
                    ...spreadIfNotUndefined('inputTokens', inputTokens),
                    ...spreadIfNotUndefined('outputTokens', outputTokens),
                },
            },
        })
    },
})

function toBillingTarget(billing: ActivepiecesAiBilling): { platformId: string, projectId: string | null, conversationId?: string } {
    switch (billing.scope) {
        case ActivepiecesAiBillingScope.PLATFORM:
            return { platformId: billing.platformId, projectId: null }
        case ActivepiecesAiBillingScope.PROJECT:
            return { platformId: billing.platformId, projectId: billing.projectId }
        case ActivepiecesAiBillingScope.CONVERSATION:
            return { platformId: billing.platformId, projectId: billing.projectId, conversationId: billing.conversationId }
    }
}

function toCredits(costUsd: number): number {
    if (isNil(costUsd) || costUsd <= 0) {
        return 0
    }
    const usdPerCredit = system.getNumberOrThrow(AppSystemProp.AI_CREDIT_USD_VALUE)
    return costUsd / usdPerCredit
}

type ReportActivepiecesAiCallParams = {
    platformId: string
    projectId: string | null
    provider: AIProviderName
    model: string
    generationId: string
    costUsd: number
    inputTokens?: number
    outputTokens?: number
    flowId?: string
    flowRunId?: string
    conversationId?: string
}
