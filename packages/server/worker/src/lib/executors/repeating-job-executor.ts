import { RenewWebhookJobData, RepeatableJobType, RepeatingJobData, ScheduledJobData } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, ConsumeJobResponse, ConsumeJobResponseStatus, FlowVersion, ProgressUpdateType, RunEnvironment, TriggerPayload, TriggerRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowWorkerCache } from '../api/flow-worker-cache'
import { workerApiService } from '../api/server-api.service'
import { triggerHooks } from '../utils/trigger-utils'

export const repeatingJobExecutor = (log: FastifyBaseLogger) => ({
    async executeRepeatingJob({ jobId, data, engineToken, workerToken }: Params): Promise<ConsumeJobResponse> {
        const { flowVersionId, jobType } = data

        const populatedFlow = await flowWorkerCache.getFlow({
            engineToken,
            flowVersionId,
        })
        const flowVersion = populatedFlow?.version ?? null
        assertNotNullOrUndefined(flowVersion, 'flowVersion')
        switch (jobType) {
            case RepeatableJobType.EXECUTE_TRIGGER:
                return await consumePieceTrigger(jobId, data, flowVersion, engineToken, workerToken, log)
            case RepeatableJobType.RENEW_WEBHOOK:
                return await consumeRenewWebhookJob(data, flowVersion, engineToken, log)

            case RepeatableJobType.DELAYED_FLOW:
                throw new Error('Delayed flow is handled by the app')
        }
    },
})


const consumePieceTrigger = async (jobId: string, data: RepeatingJobData, flowVersion: FlowVersion, engineToken: string, workerToken: string, log: FastifyBaseLogger): Promise<ConsumeJobResponse> => {
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
}

const consumeRenewWebhookJob = async (
    data: RenewWebhookJobData,
    flowVersion: FlowVersion,
    engineToken: string,
    log: FastifyBaseLogger,
): Promise<ConsumeJobResponse> => {
    log.info({ flowVersionId: data.flowVersionId }, '[FlowQueueConsumer#consumeRenewWebhookJob]')
    await triggerHooks(log).renewWebhook({
        engineToken,
        flowVersion,
        projectId: data.projectId,
        simulate: false,
    })
    return {
        status: ConsumeJobResponseStatus.OK,
    }
}



type Params = {
    jobId: string
    data: ScheduledJobData
    engineToken: string
    workerToken: string
}