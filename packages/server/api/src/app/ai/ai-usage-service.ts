import { AIProviderName, isNil, spreadIfNotUndefined } from '@activepieces/core-utils'
import { isAppSumoCreditedPlan } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { LicenseKeyPostHogEvents } from '../helper/telemetry.utils'
import { trackBillingAndSendTelemetry } from '../platform/billing-and-telemetry'
import { AiCallCreditConsumptionProperties, CreditUsageSource } from '../platform/billing-provider'

export const aiUsageService = (log: FastifyBaseLogger) => ({
    async reportManagedCall({ platformId, projectId, provider, model, generationId, costUsd, inputTokens, outputTokens, flowId, flowRunId, conversationId }: ReportManagedCallParams): Promise<void> {
        if (provider !== AIProviderName.ACTIVEPIECES) {
            log.warn({ platform: { id: platformId }, project: { id: projectId }, provider }, '[aiUsageService#reportManagedCall] Refused a cost report for a provider we do not pay for')
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
            log.info({ platform: { id: platformId }, project: { id: projectId }, model, costUsd }, '[aiUsageService#reportManagedCall] Managed call cost nothing, so nothing was deducted')
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

function toCredits(costUsd: number): number {
    if (isNil(costUsd) || costUsd <= 0) {
        return 0
    }
    const usdPerCredit = system.getNumberOrThrow(AppSystemProp.AI_CREDIT_USD_VALUE)
    return Math.round(costUsd / usdPerCredit * CREDIT_ROUNDING) / CREDIT_ROUNDING
}

const CREDIT_ROUNDING = 1_000

type ReportManagedCallParams = {
    platformId: string
    projectId: string
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
