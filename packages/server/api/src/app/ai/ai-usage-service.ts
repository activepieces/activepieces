import { ActivepiecesAiBillingScope, isNil } from '@activepieces/core-utils'
import { isAppSumoCreditedPlan, ReportAiUsageRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { trackBillingAndSendTelemetry } from '../platform/billing-and-telemetry'
import { AiCreditConsumptionProperties, ChatAppSumoConsumptionProperties, ChatCreditConsumptionProperties, CreditUsageSource } from '../platform/billing-provider'
import { chargeFor } from './ai-credits'

export const aiUsageService = (log: FastifyBaseLogger) => ({
    async report(input: ReportAiUsageRequest): Promise<void> {
        const toolCalls = input.toolCalls ?? 0
        const credits = chargeFor({ usage: input.usage, toolCalls })
        if (credits === 0) {
            return
        }
        const platformId = input.billing.platformId
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const appSumo = isAppSumoCreditedPlan(platformPlan.plan)
        const chat = chatEventOf(input, toolCalls)
        if (!isNil(chat)) {
            await trackBillingAndSendTelemetry({
                log,
                licenseKey: platformPlan.licenseKey,
                credits: { platformId, value: credits, source: CreditUsageSource.CHAT, idempotencyKey: input.idempotencyKey, properties: chat.credits },
                appSumo: appSumo ? { platformId, value: credits, source: CreditUsageSource.CHAT, idempotencyKey: `${input.idempotencyKey}:appSumo`, properties: chat.appSumo } : undefined,
            })
            return
        }
        const properties = billingProperties(input, toolCalls)
        await trackBillingAndSendTelemetry({
            log,
            licenseKey: platformPlan.licenseKey,
            credits: { platformId, value: credits, source: CreditUsageSource.AI, idempotencyKey: input.idempotencyKey, properties },
            appSumo: appSumo ? { platformId, value: credits, source: CreditUsageSource.AI, idempotencyKey: `${input.idempotencyKey}:appSumo`, properties } : undefined,
        })
    },
})

function chatEventOf(input: ReportAiUsageRequest, toolCalls: number): { credits: ChatCreditConsumptionProperties, appSumo: ChatAppSumoConsumptionProperties } | undefined {
    if (input.billing.scope !== ActivepiecesAiBillingScope.CONVERSATION || isNil(input.chat)) {
        return undefined
    }
    const { conversationId } = input.billing
    const { userId, turnIndex, tier } = input.chat
    const projectId = input.billing.projectId ?? PROJECTLESS_CHAT
    return {
        credits: {
            platformId: input.billing.platformId,
            projectId,
            userId,
            conversationId,
            turnIndex,
            messages: MESSAGES_PER_MODEL_CALL,
            toolCalls,
            provider: input.provider,
            model: input.modelId,
            tier,
        },
        appSumo: { platformId: input.billing.platformId, projectId, conversationId, turnIndex, tier },
    }
}

function billingProperties(input: ReportAiUsageRequest, toolCalls: number): AiCreditConsumptionProperties {
    return {
        platformId: input.billing.platformId,
        projectId: projectIdOf(input),
        flowId: input.flowRun?.flowId ?? OUTSIDE_A_FLOW,
        flowRunId: input.flowRun?.flowRunId ?? input.requestId ?? OUTSIDE_A_FLOW,
        environment: input.flowRun?.environment ?? OUTSIDE_A_FLOW,
        messages: MESSAGES_PER_MODEL_CALL,
        toolCalls,
        breakdown: [{
            provider: input.provider,
            model: input.modelId,
            messages: MESSAGES_PER_MODEL_CALL,
            toolCalls,
        }],
    }
}

function projectIdOf(input: ReportAiUsageRequest): string {
    if (input.billing.scope === ActivepiecesAiBillingScope.PLATFORM) {
        return PROJECTLESS_CHAT
    }
    return input.billing.projectId ?? PROJECTLESS_CHAT
}

const MESSAGES_PER_MODEL_CALL = 1
const PROJECTLESS_CHAT = 'chat'
const OUTSIDE_A_FLOW = 'none'
