import { ApplicationEventName,
    FlowRun,
    isFlowRunStateTerminal,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { applicationEvents } from '../../helper/application-events'
import { flowRunHooks } from './flow-run-hooks'
import { waitpointService } from './waitpoint/waitpoint-service'

export const flowRunSideEffects = (log: FastifyBaseLogger) => ({
    async onFinish(flowRun: FlowRun): Promise<void> {
        if (!isFlowRunStateTerminal({
            status: flowRun.status,
            ignoreInternalError: true,
        })) {
            return
        }
        await waitpointService(log).deleteByFlowRunId(flowRun.id)
        await flowRunHooks(log).onFinish(flowRun)
        applicationEvents(log).sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_FINISHED,
            data: {
                flowRun,
            },
        })
    },
    async onResume(flowRun: FlowRun): Promise<void> {
        applicationEvents(log).sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_RESUMED,
            data: {
                flowRun,
            },
        })
    },
    async onRetry(flowRun: FlowRun): Promise<void> {
        applicationEvents(log).sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_RETRIED,
            data: {
                flowRun,
            },
        })
    },
    async onStart(flowRun: FlowRun): Promise<void> {
       
        applicationEvents(log).sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_STARTED,
            data: {
                flowRun,
            },
        })
    },
})

