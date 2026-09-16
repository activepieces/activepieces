import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { ReportAiUsageRequest } from '@activepieces/shared'
import { activepiecesAiCost } from './activepieces-ai-cost'
import { aiUsageReportOf } from './ai-usage-report'
import { onCallService } from './on-call.service'

function install({ log, report, pageWebhookUrl }: InstallAiCostReporterParams): void {
    activepiecesAiCost.setReporter((event) => {
        tryCatch(() => report(aiUsageReportOf({ event, idempotencyKey: `ai:${apId()}` }))).then(({ error }) => {
            if (isNil(error)) {
                return
            }
            log.error({ error, provider: event.provider, model: { id: event.modelId }, generation: { id: event.call.generationId } }, '[aiCostReporter] An AI call went unbilled')
        }).catch(() => undefined)
    })
    startUnbilledCallWatch({ log, pageWebhookUrl })
}

function startUnbilledCallWatch({ log, pageWebhookUrl }: Omit<InstallAiCostReporterParams, 'report'>): void {
    const timer = setInterval(() => {
        const unbilledCalls = activepiecesAiCost.drainUnbilledCalls()
        if (unbilledCalls.length === 0) {
            return
        }
        const details = { unbilledCallCount: unbilledCalls.length, unbilledCalls }
        log.error(details, '[aiCostReporter] AI calls ran without a charge to bill')
        onCallService(log, pageWebhookUrl()).page({
            code: 'AI_CALLS_WENT_UNBILLED',
            message: 'AI calls ran without a charge to bill. Either a managed call reported no cost, or a call was made before the cost reporter was installed.',
            params: details,
        }).catch(() => undefined)
    }, UNBILLED_CHECK_INTERVAL_MS)
    timer.unref()
}

const UNBILLED_CHECK_INTERVAL_MS = 5 * 60 * 1000

export const aiCostReporter = {
    install,
}

export type AiCostReporterLogger = {
    error: (obj: Record<string, unknown>, msg: string) => void
}

export type InstallAiCostReporterParams = {
    log: AiCostReporterLogger
    report: (request: ReportAiUsageRequest) => Promise<void>
    pageWebhookUrl: () => string | undefined
}
