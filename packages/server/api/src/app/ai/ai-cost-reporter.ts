import { apId } from '@activepieces/core-utils'
import { activepiecesAiCost, aiUsageReportOf, onCallService } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { aiUsageService } from './ai-usage-service'

export function installAiCostReporter(log: FastifyBaseLogger): void {
    activepiecesAiCost.setReporter((event) => {
        rejectedPromiseHandler(aiUsageService(log).report(aiUsageReportOf({ event, idempotencyKey: `ai:${apId()}` })), log)
    })
    startUnbilledCallWatch(log)
}

function startUnbilledCallWatch(log: FastifyBaseLogger): void {
    const timer = setInterval(() => {
        const unbilledCalls = activepiecesAiCost.takeUnbilledCalls()
        if (unbilledCalls.length === 0) {
            return
        }
        log.error({ unbilledCallCount: unbilledCalls.length, unbilledCalls }, '[aiCostReporter] AI calls ran without a charge to bill')
        onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page({
            code: 'AI_CALLS_WENT_UNBILLED',
            message: 'AI calls ran without a charge to bill. Either a managed call reported no cost, or a call was made before the cost reporter was installed.',
            params: { unbilledCallCount: unbilledCalls.length, unbilledCalls },
        }).catch(() => undefined)
    }, UNBILLED_CHECK_INTERVAL_MS)
    timer.unref()
}

const UNBILLED_CHECK_INTERVAL_MS = 5 * 60 * 1000
