
import { DelayedJobData, logger, RenewWebhookJobData, RepeatableJobType, RepeatingJobData, ScheduledJobData } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, FlowVersion, GetFlowVersionForWorkerRequestType, isNil, PopulatedFlow, ProgressUpdateType, TriggerPayload } from '@activepieces/shared'
import { engineApiService, workerApiService } from '../api/server-api.service'
import { triggerConsumer } from '../trigger/hooks/trigger-consumer'

export const repeatingJobExecutor = {
    executeRepeatingJob,
}

async function executeRepeatingJob({ data, engineToken, workerToken }: Params): Promise<void> {
    const { flowVersionId, jobType } = data

    const populatedFlow = await engineApiService(engineToken).getFlowWithExactPieces({
        versionId: flowVersionId,
        type: GetFlowVersionForWorkerRequestType.EXACT,
    })
    const flowVersion = populatedFlow?.version ?? null
    const isStale = await isStaleFlowVersion(populatedFlow, jobType)
    if (isStale) {
        logger.info({
            message: '[FlowQueueConsumer#executeRepeatingJob]',
            flowVersionId,
            publishedVersionId: populatedFlow?.publishedVersionId,
        }, 'removing stale flow')
        await engineApiService(engineToken).removeStaleFlow({
            flowId: populatedFlow?.id,
            flowVersionId,
        })
        return
    }
    assertNotNullOrUndefined(flowVersion, 'flowVersion')
    switch (data.jobType) {
        case RepeatableJobType.EXECUTE_TRIGGER:
            await consumePieceTrigger(data, flowVersion, engineToken, workerToken)
            break
        case RepeatableJobType.DELAYED_FLOW:
            await consumeDelayedJob(data, workerToken)
            break
        case RepeatableJobType.RENEW_WEBHOOK:
            await consumeRenewWebhookJob(data, flowVersion, engineToken)
            break
    }
}



const isStaleFlowVersion = async (flow: PopulatedFlow | null, jobType: RepeatableJobType): Promise<boolean> => {
    if (isNil(flow)) {
        return true
    }
    return [RepeatableJobType.EXECUTE_TRIGGER, RepeatableJobType.RENEW_WEBHOOK].includes(jobType) && flow.publishedVersionId !== flow.version.id
}

const consumePieceTrigger = async (data: RepeatingJobData, flowVersion: FlowVersion, engineToken: string, workerToken: string): Promise<void> => {
    const payloads: unknown[] = await triggerConsumer.extractPayloads(engineToken, {
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
    })
}

const consumeRenewWebhookJob = async (
    data: RenewWebhookJobData,
    flowVersion: FlowVersion,
    engineToken: string,
): Promise<void> => {
    logger.info(
        `[FlowQueueConsumer#consumeRenewWebhookJob] flowVersionId=${data.flowVersionId}`,
    )
    await triggerConsumer.renewWebhook({
        engineToken,
        flowVersion,
        projectId: data.projectId,
        simulate: false,
    })
}

const consumeDelayedJob = async (data: DelayedJobData, workerToken: string): Promise<void> => {
    logger.info(`[FlowQueueConsumer#consumeDelayedJob] flowRunId=${data.runId}`)
    await workerApiService(workerToken).resumeRun(data)
}


type Params = {
    data: ScheduledJobData
    engineToken: string
    workerToken: string
}