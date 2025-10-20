import { assertNotNullOrUndefined, ConsumeJobResponse, ConsumeJobResponseStatus, PollingJobData, ProgressUpdateType, RunEnvironment, TriggerPayload, TriggerRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../../api/server-api.service'
import { flowWorkerCache } from '../../cache/flow-worker-cache'
import { triggerHooks } from '../../utils/trigger-utils'

export const executeTriggerExecutor = (log: FastifyBaseLogger) => ({
    async executeTrigger({ jobId, data, engineToken, workerToken, timeoutInSeconds }: ExecuteTriggerParams): Promise<ConsumeJobResponse> {
        const { flowVersionId } = data

        const flowVersion = await flowWorkerCache(log).getVersion({
            engineToken,
            flowVersionId,
        })
        assertNotNullOrUndefined(flowVersion, 'flowVersion')

        const { payloads, status, errorMessage } = await triggerHooks(log).extractPayloads(engineToken, {
            projectId: data.projectId,
            flowVersion,
            payload: {} as TriggerPayload,
            simulate: false,
            jobId,
            timeoutInSeconds,
        })
        if (status === TriggerRunStatus.INTERNAL_ERROR) {
            return {
                status: ConsumeJobResponseStatus.INTERNAL_ERROR,
                errorMessage,
            }
        }
        await workerApiService(workerToken).startRuns({
            flowVersionId: data.flowVersionId,
            platformId: data.platformId,
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
    timeoutInSeconds: number
}