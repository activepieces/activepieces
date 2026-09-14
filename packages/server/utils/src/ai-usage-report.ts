import { ActivepiecesAiBillingScope, ActivepiecesAiCall, ActivepiecesAiCostEvent, AiChargeBasis, spreadIfDefined } from '@activepieces/core-utils'
import { AiUsageCharge, ReportAiUsageRequest } from '@activepieces/shared'

export function aiUsageReportOf({ event, idempotencyKey }: AiUsageReportParams): ReportAiUsageRequest {
    const { billing, provider, modelId, call } = event
    const baseProps: ReportAiUsageRequest = {
        billing,
        provider,
        modelId,
        idempotencyKey,
        usage: chargeOf(call),
        ...spreadIfDefined('generationId', call.generationId),
        ...spreadIfDefined('inputTokens', call.inputTokens),
        ...spreadIfDefined('outputTokens', call.outputTokens),
    }
    switch (billing.scope) {
        case ActivepiecesAiBillingScope.PROJECT:
            return { ...baseProps, ...spreadIfDefined('flowRun', billing.flowRun) }
        case ActivepiecesAiBillingScope.CONVERSATION:
            return { ...baseProps, ...spreadIfDefined('chat', billing.chat) }
        case ActivepiecesAiBillingScope.PLATFORM:
            return baseProps
    }
}

function chargeOf(call: ActivepiecesAiCall): AiUsageCharge {
    if (call.charge === AiChargeBasis.FIXED_CREDITS) {
        return { type: AiChargeBasis.FIXED_CREDITS, credits: call.credits }
    }
    return { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: call.costUsd }
}

export type AiUsageReportParams = {
    event: ActivepiecesAiCostEvent
    idempotencyKey: string
}
