import { isManualPieceTrigger, isNil, tryCatch } from '@activepieces/core-utils'
import { ApEdition, ConsumableFeatureId, FlowActionType, FlowRun, FlowRunStatus, flowStructureUtil, FlowTriggerType, FlowVersion, isFailedState, isFlowRunStateTerminal, RunEnvironment, WebsocketClientEvent } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { alertsService } from '../../ee/alerts/alerts-service'
import { system } from '../../helper/system/system'
import { billingProvider, CreditUsageSource, toFlowRunCreditProperties } from '../../platform/billing-provider'
import { projectService } from '../../project/project-service'
import { flowVersionService } from '../flow-version/flow-version.service'

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
            })
        }
        if (isFailedState(flowRun.status) && flowRun.environment === RunEnvironment.PRODUCTION && !isNil(flowRun.failedStep)) {
            logFailedCodeStep({ log, flowRun, flowVersion })
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
        if (!paidEditions) {
            return
        }
        if (flowRun.environment === RunEnvironment.PRODUCTION && flowRun.status !== FlowRunStatus.QUOTA_EXCEEDED) {
            const { error: creditError } = await tryCatch(() => trackProductionRunCredit(log, flowRun))
            if (creditError) {
                log.warn({ error: creditError, flowRun: { id: flowRun.id } }, 'Failed to track production run credit')
            }
        }
    },
})

function logFailedCodeStep({ log, flowRun, flowVersion }: LogFailedCodeStepParams): void {
    if (isNil(flowVersion) || isNil(flowRun.failedStep)) {
        return
    }
    const failedStep = flowStructureUtil.getStep(flowRun.failedStep.name, flowVersion.trigger)
    if (isNil(failedStep) || failedStep.type !== FlowActionType.CODE) {
        return
    }
    log.warn({
        flowRun: { id: flowRun.id, status: flowRun.status, environment: flowRun.environment },
        flow: { id: flowRun.flowId },
        flowVersion: { id: flowRun.flowVersionId },
        project: { id: flowRun.projectId },
        step: { name: flowRun.failedStep.name },
        codeRuntime: failedStep.settings.useDeno !== false ? 'deno' : 'legacy',
        error: flowRun.failedStep.message,
    }, 'Code step failed')
}

async function trackProductionRunCredit(log: FastifyBaseLogger, flowRun: FlowRun): Promise<void> {
    const project = await projectService(log).getOne(flowRun.projectId)
    if (isNil(project)) {
        return
    }
    await billingProvider.get(log).trackFeature({
        featureId: ConsumableFeatureId.AP_CREDITS,
        platformId: project.platformId,
        value: 1,
        source: CreditUsageSource.FLOW_RUN,
        idempotencyKey: `${flowRun.id}:run`,
        properties: toFlowRunCreditProperties({ platformId: project.platformId, flowRun }),
    })
}


type LogFailedCodeStepParams = {
    log: FastifyBaseLogger
    flowRun: FlowRun
    flowVersion: FlowVersion | null
}
