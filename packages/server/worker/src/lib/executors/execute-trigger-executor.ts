import { assertNotNullOrUndefined, ConsumeJobResponse, ConsumeJobResponseStatus, PollingJobData, ProgressUpdateType, RunEnvironment, TriggerPayload, TriggerRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowWorkerCache } from '../cache/flow-worker-cache'
import { workerApiService } from '../api/server-api.service'
import { triggerHooks } from '../utils/trigger-utils'

export const executeTriggerExecutor = (log: FastifyBaseLogger) => ({
    async executeTrigger({ jobId, data, engineToken, workerToken }: ExecuteTriggerParams): Promise<ConsumeJobResponse> {
        const { flowVersionId } = data

        const populatedFlow = await flowWorkerCache.getFlow({
            engineToken,
            flowVersionId,
        })
        const flowVersion = populatedFlow?.version ?? null
        assertNotNullOrUndefined(flowVersion, 'flowVersion')

        const { payloads, status, errorMessage } = await triggerHooks(log).extractPayloads(engineToken, {
            projectId: data.projectId,
            flowVersion,
            payload: {} as TriggerPayload,
            simulate: false,
            jobId,
        })
        if (status === TriggerRunStatus.INTERNAL_ERROR) {
            return {
                status: ConsumeJobResponseStatus.INTERNAL_ERROR,
                errorMessage,
            }
        }
        await workerApiService(workerToken).startRuns({
            flowVersionId: data.flowVersionId,
            progressUpdateType: ProgressUpdateType.NONE,
            projectId: data.projectId,
            payloads,
            environment: RunEnvironment.PRODUCTION,
        })
        return {
            status: ConsumeJobResponseStatus.OK,
        }
    },
})

type ExecuteTriggerParams = {
    jobId: string
    data: PollingJobData
    engineToken: string
    workerToken: string
}