import { ActivepiecesAiBilling, ActivepiecesAiBillingScope, ActivepiecesAiCall, apId, isNil, spreadIfDefined, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { activepiecesAiCost, onCallService } from '@activepieces/server-utils'
import { AiUsageCharge, AiUsageChatContext, AiUsageFlowRunContext, WorkerToApiContract } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerSettings } from '../../../config/worker-settings'

export function installAiCostReporter({ apiClient, log }: {
    apiClient: WorkerToApiContract
    log: FastifyBaseLogger
}): void {
    activepiecesAiCost.setReporter(({ billing, provider, modelId, call }) => {
        void tryCatch(() => apiClient.reportAiUsage({
            billing,
            provider,
            modelId,
            idempotencyKey: `ai:${apId()}`,
            usage: chargeFor(call),
            ...spreadIfDefined('generationId', call.generationId),
            ...spreadIfDefined('flowRun', flowRunOf(billing)),
            ...spreadIfDefined('chat', chatOf(billing)),
        })).then(({ error }) => {
            if (isNil(error)) {
                return
            }
            log.error({ error, provider, model: modelId, generationId: call.generationId }, '[aiCostReporter] An AI call went unbilled')
        })
    })
    startUnbilledCallWatch(log)
}

function startUnbilledCallWatch(log: FastifyBaseLogger): void {
    let lastSeen = 0
    const timer = setInterval(() => {
        const unbilled = activepiecesAiCost.unreportedCallCount()
        if (unbilled <= lastSeen) {
            return
        }
        const since = unbilled - lastSeen
        lastSeen = unbilled
        log.error({ unbilledCallCount: unbilled, sinceLastCheck: since }, '[aiCostReporter] AI calls ran without a charge to bill')
        const { data: settings } = tryCatchSync(() => workerSettings.getSettings())
        void onCallService(log, settings?.PAGE_ONCALL_WEBHOOK).page({
            code: 'AI_CALLS_WENT_UNBILLED',
            message: 'AI calls ran without a charge to bill. Either a managed call reported no cost, or a call was made before the cost reporter was installed.',
            params: { unbilledCallCount: unbilled, sinceLastCheck: since },
        })
    }, UNBILLED_CHECK_INTERVAL_MS)
    timer.unref()
}

function flowRunOf(billing: ActivepiecesAiBilling): AiUsageFlowRunContext | undefined {
    return billing.scope === ActivepiecesAiBillingScope.PROJECT ? billing.flowRun : undefined
}

function chatOf(billing: ActivepiecesAiBilling): AiUsageChatContext | undefined {
    return billing.scope === ActivepiecesAiBillingScope.CONVERSATION ? billing.chat : undefined
}

function chargeFor(call: ActivepiecesAiCall): AiUsageCharge {
    if (call.charge === 'flat-credits') {
        return { type: 'flat-credits', credits: call.credits }
    }
    return { type: 'observed-cost', costUsd: call.costUsd }
}

const UNBILLED_CHECK_INTERVAL_MS = 5 * 60 * 1000
