
import { DelayedJobData, RenewWebhookJobData, RepeatableJobType, RepeatingJobData, ScheduledJobData } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, FlowStatus, FlowVersion, GetFlowVersionForWorkerRequestType, isNil, PopulatedFlow, ProgressUpdateType, RunEnvironment, TriggerPayload } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService, workerApiService } from '../api/server-api.service'
import { triggerConsumer } from '../trigger/hooks/trigger-consumer'

export const repeatingJobExecutor = (log: FastifyBaseLogger) => ({
    async executeRepeatingJob({ data, engineToken, workerToken }: Params): Promise<void> {
        const { flowVersionId, jobType } = data

        const populatedFlow = await engineApiService(engineToken, log).getFlowWithExactPieces({
            versionId: flowVersionId,
            type: GetFlowVersionForWorkerRequestType.EXACT,
        }, flowVersionId)
        const flowVersion = populatedFlow?.version ?? null
        const isStale = await isStaleFlowVersion(populatedFlow, jobType)
        if (isStale) {
            log.info({
                message: '[FlowQueueConsumer#executeRepeatingJob]',
                flowVersionId,
                publishedVersionId: populatedFlow?.publishedVersionId,
            }, 'removing stale flow')
            await engineApiService(engineToken, log).removeStaleFlow({
                flowId: populatedFlow?.id,
                flowVersionId,
            })
            return
        }
        if (populatedFlow?.status === FlowStatus.DISABLED) {
            log.info({
                message: '[FlowQueueConsumer#executeRepeatingJob]',
                flowVersionId,
                publishedVersionId: populatedFlow?.publishedVersionId,
            }, 'skipping disabled flow')
            return
        }
        assertNotNullOrUndefined(flowVersion, 'flowVersion')
        switch (data.jobType) {
            case RepeatableJobType.EXECUTE_TRIGGER:
                await consumePieceTrigger(data, flowVersion, engineToken, workerToken, log)
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

const isStaleFlowVersion = async (flow: PopulatedFlow | null, jobType: RepeatableJobType): Promise<boolean> => {
    if (isNil(flow)) {
        return true
    }
    return [RepeatableJobType.EXECUTE_TRIGGER, RepeatableJobType.RENEW_WEBHOOK].includes(jobType) && flow.publishedVersionId !== flow.version.id
}

const consumePieceTrigger = async (data: RepeatingJobData, flowVersion: FlowVersion, engineToken: string, workerToken: string, log: FastifyBaseLogger): Promise<void> => {
    const payloads: unknown[] = await triggerConsumer.extractPayloads(engineToken, log, {
        projectId: data.projectId,
        flowVersion,
        payload: {} as TriggerPayload,
        simulate: false,
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
    await triggerConsumer.renewWebhook({
        engineToken,
        flowVersion,
        projectId: data.projectId,
        simulate: false,
    }, log)
}

const consumeDelayedJob = async (data: DelayedJobData, workerToken: string, log: FastifyBaseLogger): Promise<void> => {
    log.info({ runId: data.runId }, '[FlowQueueConsumer#consumeDelayedJob]')
    await workerApiService(workerToken).resumeRun(data)
}


type Params = {
    data: ScheduledJobData
    engineToken: string
    workerToken: string
}