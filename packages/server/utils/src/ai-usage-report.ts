import { ActivepiecesAiCall, ActivepiecesAiConsumerSource, ActivepiecesAiCostEvent, AiChargeBasis } from '@activepieces/core-utils'
import { AiUsageCharge, ReportAiUsageRequest } from '@activepieces/shared'

export function aiUsageReportOf({ event, idempotencyKey }: AiUsageReportParams): ReportAiUsageRequest {
    const { billing, provider, modelId, call } = event
    const baseProps: ReportAiUsageRequest = {
        billing,
        provider,
        modelId,
        idempotencyKey,
        usage: chargeOf(call),
        generationId: call.generationId,
        inputTokens: call.inputTokens,
        outputTokens: call.outputTokens,
    }
    switch (billing.source) {
        case ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW:
            return { ...baseProps, flowRun: billing.flowRun }
        case ActivepiecesAiConsumerSource.CHAT:
            return { ...baseProps, chat: billing.chat }
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
