import { isManualPieceTrigger, isNil, tryCatch } from '@activepieces/core-utils'
import { ApEdition, FlowRun, FlowRunStatus, FlowTriggerType, isFailedState, isFlowRunStateTerminal, RunEnvironment, UpdateRunProgressRequest, WebsocketClientEvent } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { alertsService } from '../../ee/alerts/alerts-service'
import { system } from '../../helper/system/system'
import { billingProvider, CreditUsageSource } from '../../platform/billing-provider'
import { projectService } from '../../project/project-service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { aiUsageTracker } from './ai-usage-tracker'

const paidEditions = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())
export const flowRunHooks = (log: FastifyBaseLogger) => ({
    async onFinish(flowRun: FlowRun): Promise<void> {
        if (!isFlowRunStateTerminal({
            status: flowRun.status,
            ignoreInternalError: true,
        })) {
            return
        }
        const flowVersion = await flowVersionService(log).getOne(flowRun.flowVersionId)
        const isPieceTrigger = !isNil(flowVersion) && flowVersion.trigger.type === FlowTriggerType.PIECE && !isNil(flowVersion.trigger.settings.triggerName) 
        const isManualTrigger = isPieceTrigger && isManualPieceTrigger({ pieceName: flowVersion.trigger.settings.pieceName, triggerName: flowVersion.trigger.settings.triggerName })
        if (flowRun.environment === RunEnvironment.TESTING || isManualTrigger) {
            websocketService.to(flowRun.projectId).emit(WebsocketClientEvent.UPDATE_RUN_PROGRESS, {
                flowRun,
            } satisfies UpdateRunProgressRequest)
        }
        if (isFailedState(flowRun.status) && flowRun.environment === RunEnvironment.PRODUCTION && !isNil(flowRun.failedStep)) {
            const date = dayjs(flowRun.created).toISOString()
            const issueToAlert = {
                projectId: flowRun.projectId,
                flowVersionId: flowRun.flowVersionId,
                flowId: flowRun.flowId,
                created: date,
            }

            if (paidEditions) {
                await alertsService(log).sendAlertOnRunFinish({
                    issueToAlert,
                    flowRunId: flowRun.id,
                    failedStep: flowRun.failedStep,
                })
            }
        }
        if (!paidEditions || isNil(flowVersion)) {
            return
        }
        const { error } = await tryCatch(() => aiUsageTracker(log).track({ flowRun, flowVersion }))
        if (error) {
            log.warn({ error, flowRun: { id: flowRun.id } }, 'Failed to capture AI usage event')
        }
        if (flowRun.environment === RunEnvironment.PRODUCTION && flowRun.status !== FlowRunStatus.QUOTA_EXCEEDED) {
            const { error: creditError } = await tryCatch(() => trackProductionRunCredit(log, flowRun))
            if (creditError) {
                log.warn({ error: creditError, flowRun: { id: flowRun.id } }, 'Failed to track production run credit')
            }
        }
    },
})

async function trackProductionRunCredit(log: FastifyBaseLogger, flowRun: FlowRun): Promise<void> {
    const project = await projectService(log).getOne(flowRun.projectId)
    if (isNil(project)) {
        return
    }
    await billingProvider.get(log).trackCredits({
        platformId: project.platformId,
        value: 1,
        source: CreditUsageSource.FLOW_RUN,
        idempotencyKey: `${flowRun.id}:run`,
        properties: {
            platformId: project.platformId,
            projectId: flowRun.projectId,
            flowId: flowRun.flowId,
            flowRunId: flowRun.id,
            environment: flowRun.environment,
        },
    })
}
