import { ApEdition, FlowRun, isFailedState, isFlowRunStateTerminal, isNil, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { alertsService } from '../../ee/alerts/alerts-service'
import { issuesService } from '../../flows/issues/issues-service'
import { system } from '../../helper/system/system'

const paidEditions = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())
export const flowRunHooks = (log: FastifyBaseLogger) => ({
    async onFinish(flowRun: FlowRun): Promise<void> {
        if (!isFlowRunStateTerminal({
            status: flowRun.status,
            ignoreInternalError: true,
        })) {
            return
        }
        if (isFailedState(flowRun.status) && flowRun.environment === RunEnvironment.PRODUCTION && !isNil(flowRun.failedStepName)) {
            const issue = await issuesService(log).add(flowRun)
            if (paidEditions) {
                await alertsService(log).sendAlertOnRunFinish({ issue, flowRunId: flowRun.id })
            }
        }
        if (!paidEditions) {
            return
        }
    },
})
