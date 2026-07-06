import { ApplicationEventName,
    FlowRun,
    isFlowRunStateTerminal,
    PlatformId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { applicationEvents } from '../../helper/application-events'
import { flowRunHooks } from './flow-run-hooks'
import { waitpointService } from './waitpoint/waitpoint-service'

export const flowRunSideEffects = (log: FastifyBaseLogger) => ({
    async onFinish({ flowRun, platformId }: FlowRunSideEffectParams): Promise<void> {
        if (!isFlowRunStateTerminal({
            status: flowRun.status,
            ignoreInternalError: true,
        })) {
            return
        }
        await waitpointService(log).deleteByFlowRunId(flowRun.id)
        await flowRunHooks(log).onFinish(flowRun)
        applicationEvents(log).sendWorkerEvent({
            projectId: flowRun.projectId,
            platformId,
            action: ApplicationEventName.FLOW_RUN_FINISHED,
            data: {
                flowRun,
            },
        })
    },
    async onResume({ flowRun, platformId }: FlowRunSideEffectParams): Promise<void> {
        applicationEvents(log).sendWorkerEvent({
            projectId: flowRun.projectId,
            platformId,
            action: ApplicationEventName.FLOW_RUN_RESUMED,
            data: {
                flowRun,
            },
        })
    },
    async onRetry({ flowRun, platformId }: FlowRunSideEffectParams): Promise<void> {
        applicationEvents(log).sendWorkerEvent({
            projectId: flowRun.projectId,
            platformId,
            action: ApplicationEventName.FLOW_RUN_RETRIED,
            data: {
                flowRun,
            },
        })
    },
    async onStart({ flowRun, platformId }: FlowRunSideEffectParams): Promise<void> {
        applicationEvents(log).sendWorkerEvent({
            projectId: flowRun.projectId,
            platformId,
            action: ApplicationEventName.FLOW_RUN_STARTED,
            data: {
                flowRun,
            },
        })
    },
})

type FlowRunSideEffectParams = {
    flowRun: FlowRun
    platformId: PlatformId
}
