import { ApEdition, FlowRun, flowStructureUtil, FlowTriggerKind, isFailedState, isFlowRunStateTerminal, isManualPieceTrigger, isNil, PieceTrigger, RunEnvironment, UpdateRunProgressRequest, WebsocketClientEvent } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { alertsService } from '../../ee/alerts/alerts-service'
import { system } from '../../helper/system/system'
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
        const triggerNode = !isNil(flowVersion) ? flowStructureUtil.getTriggerNode(flowVersion.graph) : undefined
        const isPieceTrigger = !isNil(triggerNode) && triggerNode.data.kind === FlowTriggerKind.PIECE && !isNil((triggerNode.data as PieceTrigger).settings.triggerName)
        const isManualTrigger = isPieceTrigger && isManualPieceTrigger({ pieceName: (triggerNode!.data as PieceTrigger).settings.pieceName, triggerName: (triggerNode!.data as PieceTrigger).settings.triggerName! })
        if (flowRun.environment === RunEnvironment.TESTING || isManualTrigger) {
            websocketService.to(flowRun.projectId).emit(WebsocketClientEvent.UPDATE_RUN_PROGRESS, {
                flowRun,
            } satisfies UpdateRunProgressRequest)
        }
        if (isFailedState(flowRun.status) && flowRun.environment === RunEnvironment.PRODUCTION && !isNil(flowRun.failedStep?.name)) {
            const date = dayjs(flowRun.created).toISOString()
            const issueToAlert = {
                projectId: flowRun.projectId,
                flowVersionId: flowRun.flowVersionId,
                flowId: flowRun.flowId,
                created: date,
            }

            if (paidEditions) {
                await alertsService(log).sendAlertOnRunFinish({ issueToAlert, flowRunId: flowRun.id })
            }
        }
        if (!paidEditions) {
            return
        }
    },
})
