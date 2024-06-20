import { isNil } from 'lodash'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { triggerHooks } from '../../flows/trigger'
import { dedupeService } from '../../flows/trigger/dedupe'
import { flowQueue } from '../queue'
import { logger } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, ExecutionType, FlowVersion, ProgressUpdateType, RunEnvironment, TriggerPayload } from '@activepieces/shared'
import { DelayedJobData, RenewWebhookJobData, RepeatableJobType, RepeatingJobData, ScheduledJobData } from 'server-worker'

export const repeatingJobExecutor = {
    executeRepeatingJob,
}

async function executeRepeatingJob(data: ScheduledJobData): Promise<void> {
    const { flowVersionId, jobType } = data
    const flowVersion = await flowVersionService.getOne(flowVersionId)
    const isStale = await isStaleFlowVersion(flowVersion, jobType)
    if (isStale) {
        await removeStaleFlowVersion(flowVersion, data)
        return
    }
    assertNotNullOrUndefined(flowVersion, 'flowVersion')
    switch (data.jobType) {
        case RepeatableJobType.EXECUTE_TRIGGER:
            await consumePieceTrigger(data, flowVersion)
            break
        case RepeatableJobType.DELAYED_FLOW:
            await consumeDelayedJob(data)
            break
        case RepeatableJobType.RENEW_WEBHOOK:
            await consumeRenewWebhookJob(data, flowVersion)
            break
    }
}

const removeStaleFlowVersion = async (flowVersion: FlowVersion | null, jobData: ScheduledJobData): Promise<void> => {
    if (isNil(flowVersion)) {
        await flowQueue.removeRepeatingJob({
            id: jobData.flowVersionId,
        })
        return
    }
    await triggerHooks.disable({
        projectId: jobData.projectId,
        flowVersion,
        simulate: false,
        ignoreError: true,
    })
}

const isStaleFlowVersion = async (flowVersion: FlowVersion | null, jobType: RepeatableJobType): Promise<boolean> => {
    if (isNil(flowVersion)) {
        return true
    }
    const flow = await flowService.getOneById(flowVersion.flowId)
    if (isNil(flow)) {
        return true
    }
    return [RepeatableJobType.EXECUTE_TRIGGER, RepeatableJobType.RENEW_WEBHOOK].includes(jobType) && flow.publishedVersionId !== flowVersion.id
}

const consumePieceTrigger = async (data: RepeatingJobData, flowVersion: FlowVersion): Promise<void> => {
    const payloads: unknown[] = await triggerHooks.executeTrigger({
        projectId: data.projectId,
        flowVersion,
        payload: {} as TriggerPayload,
        simulate: false,
    })

    logger.info(
        `[flowQueueConsumer#consumePieceTrigger] payloads.length=${payloads.length}`,
    )

    const filterPayloads = await dedupeService.filterUniquePayloads(
        data.flowVersionId,
        payloads,
    )
    const createFlowRuns = filterPayloads.map((payload) =>
        flowRunService.start({
            environment: RunEnvironment.PRODUCTION,
            flowVersionId: data.flowVersionId,
            payload,
            projectId: data.projectId,
            executionType: ExecutionType.BEGIN,
            progressUpdateType: ProgressUpdateType.NONE,
        }),
    )

    await Promise.all(createFlowRuns)
}

const consumeRenewWebhookJob = async (
    data: RenewWebhookJobData,
    flowVersion: FlowVersion,
): Promise<void> => {
    logger.info(
        `[FlowQueueConsumer#consumeRenewWebhookJob] flowVersionId=${data.flowVersionId}`,
    )
    await triggerHooks.renewWebhook({
        flowVersion,
        projectId: data.projectId,
        simulate: false,
    })
}

const consumeDelayedJob = async (data: DelayedJobData): Promise<void> => {
    logger.info(`[FlowQueueConsumer#consumeDelayedJob] flowRunId=${data.runId}`)

    await flowRunService.start({
        payload: null,
        flowRunId: data.runId,
        synchronousHandlerId: data.synchronousHandlerId ?? undefined,
        projectId: data.projectId,
        flowVersionId: data.flowVersionId,
        executionType: ExecutionType.RESUME,
        environment: RunEnvironment.PRODUCTION,
        progressUpdateType: data.progressUpdateType,
    })
}

