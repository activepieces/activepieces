import { FlowRun } from '@activepieces/shared'
import { JobType, flowQueue } from '../../workers/flow-worker/flow-queue'

type StartParams = {
    flowRun: FlowRun
    payload: unknown
}

export const flowRunSideEffects = {
    async start({ flowRun, payload }: StartParams): Promise<void> {
        await flowQueue.add({
            id: flowRun.id,
            type: JobType.ONE_TIME,
            data: {
                projectId: flowRun.projectId,
                environment: flowRun.environment,
                runId: flowRun.id,
                flowVersionId: flowRun.flowVersionId,
                collectionId: flowRun.collectionId,
                payload,
            },
        })
    },
}
