import {
    FlowRun,
    isFlowRunStateTerminal,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunHooks } from './flow-run-hooks'

// Simple event names for community edition
enum ApplicationEventName {
    FLOW_RUN_FINISHED = 'flow-run.finished',
    FLOW_RUN_RESUMED = 'flow-run.resumed',
    FLOW_RUN_STARTED = 'flow-run.started',
}

export const flowRunSideEffects = (log: FastifyBaseLogger) => ({
    async onFinish(flowRun: FlowRun): Promise<void> {
        if (!isFlowRunStateTerminal({
            status: flowRun.status,
            ignoreInternalError: true,
        })) {
            return
        }
        await flowRunHooks(log).onFinish(flowRun)
        // Log event instead of sending to EE event system
        log.info({
            action: ApplicationEventName.FLOW_RUN_FINISHED,
            flowRunId: flowRun.id,
            projectId: flowRun.projectId,
        }, 'Flow run finished')
    },
    async onResume(flowRun: FlowRun): Promise<void> {
        // Log event instead of sending to EE event system
        log.info({
            action: ApplicationEventName.FLOW_RUN_RESUMED,
            flowRunId: flowRun.id,
            projectId: flowRun.projectId,
        }, 'Flow run resumed')
    },
    async onStart(flowRun: FlowRun): Promise<void> {
        // Log event instead of sending to EE event system
        log.info({
            action: ApplicationEventName.FLOW_RUN_STARTED,
            flowRunId: flowRun.id,
            projectId: flowRun.projectId,
        }, 'Flow run started')
    },
})
