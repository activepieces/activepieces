
import { DelayedJobData, RenewWebhookJobData, RepeatableJobType, RepeatingJobData, ScheduledJobData } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, FlowVersion, ProgressUpdateType, RunEnvironment, TriggerPayload } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowWorkerCache } from '../api/flow-worker-cache'
import { workerApiService } from '../api/server-api.service'
import { triggerHooks } from '../utils/trigger-utils'

export const repeatingJobExecutor = (log: FastifyBaseLogger) => ({
    async executeRepeatingJob({ jobId, data, engineToken, workerToken }: Params): Promise<void> {
        const { flowVersionId, jobType } = data

        const populatedFlow = await flowWorkerCache(log).getFlow({
            engineToken,
            flowVersionId,
        })
        const flowVersion = populatedFlow?.version ?? null
        assertNotNullOrUndefined(flowVersion, 'flowVersion')
        switch (jobType) {
            case RepeatableJobType.EXECUTE_TRIGGER:
                await consumePieceTrigger(jobId, data, flowVersion, engineToken, workerToken, log)
                break
            case RepeatableJobType.DELAYED_FLOW:
                await consumeDelayedJob(data, workerToken, log)
                break
            case RepeatableJobType.RENEW_WEBHOOK:
                await consumeRenewWebhookJob(data, flowVersion, engineToken, log)
                break
        }
    },
})


const consumePieceTrigger = async (jobId: string, data: RepeatingJobData, flowVersion: FlowVersion, engineToken: string, workerToken: string, log: FastifyBaseLogger): Promise<void> => {
    const payloads: unknown[] = await triggerHooks(log).extractPayloads(engineToken, {
        projectId: data.projectId,
        flowVersion,
        payload: {} as TriggerPayload,
        simulate: false,
        jobId,
    })
    await workerApiService(workerToken).startRuns({
        flowVersionId: data.flowVersionId,
        progressUpdateType: ProgressUpdateType.NONE,
        projectId: data.projectId,
        payloads,
        environment: RunEnvironment.PRODUCTION,
    })
}

const consumeRenewWebhookJob = async (
    data: RenewWebhookJobData,
    flowVersion: FlowVersion,
    engineToken: string,
    log: FastifyBaseLogger,
): Promise<void> => {
    log.info({ flowVersionId: data.flowVersionId }, '[FlowQueueConsumer#consumeRenewWebhookJob]')
    await triggerHooks(log).renewWebhook({
        engineToken,
        flowVersion,
        projectId: data.projectId,
        simulate: false,
    })
}

const consumeDelayedJob = async (data: DelayedJobData, workerToken: string, log: FastifyBaseLogger): Promise<void> => {
    log.info({ runId: data.runId }, '[FlowQueueConsumer#consumeDelayedJob]')
    await workerApiService(workerToken).resumeRun(data)
}


type Params = { 
    jobId: string
    data: ScheduledJobData
    engineToken: string
    workerToken: string
}