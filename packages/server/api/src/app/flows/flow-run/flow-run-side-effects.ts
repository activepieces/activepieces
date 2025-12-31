import { ApplicationEventName } from '@activepieces/ee-shared'
import {
    FlowRun,
    isFlowRunStateTerminal,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { applicationEvents } from '../../helper/application-events'
import { flowRunHooks } from './flow-run-hooks'

export const flowRunSideEffects = (log: FastifyBaseLogger) => ({
    async onFinish(flowRun: FlowRun): Promise<void> {
        if (!isFlowRunStateTerminal({
            status: flowRun.status,
            ignoreInternalError: true,
        })) {
            return
        }
        await flowRunHooks(log).onFinish(flowRun)
        applicationEvents.sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_FINISHED,
            data: {
                flowRun,
            },
        })
    },
    async onResume(flowRun: FlowRun): Promise<void> {
        applicationEvents.sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_RESUMED,
            data: {
                flowRun,
            },
        })
    },
    async onStart(flowRun: FlowRun): Promise<void> {
       
        applicationEvents.sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_STARTED,
            data: {
                flowRun,
            },
        })
    },
})

