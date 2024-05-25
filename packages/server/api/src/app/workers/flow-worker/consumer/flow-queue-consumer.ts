import { flowService } from '../../../flows/flow/flow.service'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { triggerHooks } from '../../../flows/trigger'
import { dedupeService } from '../../../flows/trigger/dedupe'
import { flowQueue } from '../flow-queue'
import { flowWorker } from '../flow-worker'
import { consumeJobsInMemory } from '../queues/memory/memory-consumer'
import { memoryQueueManager } from '../queues/memory/memory-queue'
import { redisConsumer } from '../queues/redis/redis-consumer'
import { redisQueueManager } from '../queues/redis/redis-queue'
import { enrichErrorContext, exceptionHandler, logger, QueueMode, system, SystemProp } from '@activepieces/server-shared'
import { ActivepiecesError,
    ErrorCode,
    ExecutionType,
    FlowStatus,
    isNil,
    ProgressUpdateType,
    RunEnvironment,
    TriggerPayload,
    TriggerType,
} from '@activepieces/shared'
import {
    DelayedJobData,
    OneTimeJobData,
    RenewWebhookJobData,
    RepeatableJobType,
    RepeatingJobData,
    ScheduledJobData,
} from 'server-worker'

const queueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)

const initFlowQueueConsumer = async (): Promise<void> => {
    switch (queueMode) {
        case QueueMode.MEMORY: {
            await memoryQueueManager.init()
            consumeJobsInMemory().catch((e) =>
                logger.error(e, '[FlowQueueConsumer#init] consumeJobsInMemory'),
            )
            break
        }
        case QueueMode.REDIS: {
            await redisQueueManager.init()
            await redisConsumer.init()
            break
        }
    }
}

const close = async (): Promise<void> => {
    logger.info('[FlowQueueConsumer#close] closing all consumers')
    switch (queueMode) {
        case QueueMode.MEMORY: {
            break
        }
        case QueueMode.REDIS: {
            await redisConsumer.close()
            break
        }
    }
}

async function consumeOnetimeJob(data: OneTimeJobData): Promise<void> {
    try {
        await flowWorker.executeFlow(data)
    }
    catch (error) {
        const contextKey = '[FlowQueueConsumer#consumeOnetimeJob]'
        const contextValue = { jobData: data }

        const enrichedError = enrichErrorContext({
            error,
            key: contextKey,
            value: contextValue,
        })

        logger.error(enrichedError)
        throw enrichedError
    }
}

async function consumeScheduledJobs(data: ScheduledJobData): Promise<void> {
    try {
        switch (data.jobType) {
            case RepeatableJobType.EXECUTE_TRIGGER:
                await consumeRepeatingJob(data)
                break
            case RepeatableJobType.DELAYED_FLOW:
                await consumeDelayedJob(data)
                break
            case RepeatableJobType.RENEW_WEBHOOK:
                await consumeRenewWebhookJob(data)
                break
        }
    }
    catch (e) {
        exceptionHandler.handle(e)
    }
}

const consumeRenewWebhookJob = async (
    data: RenewWebhookJobData,
): Promise<void> => {
    logger.info(
        `[FlowQueueConsumer#consumeRenewWebhookJob] flowVersionId=${data.flowVersionId}`,
    )
    const flowVersion = await flowVersionService.getOneOrThrow(
        data.flowVersionId,
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

const consumeRepeatingJob = async (data: RepeatingJobData): Promise<void> => {
    try {
        // TODO REMOVE AND FIND PERMANENT SOLUTION
        const flow = await flowService.getOne({
            id: data.flowId,
            projectId: data.projectId,
        })

        if (
            isNil(flow) ||
            flow.status !== FlowStatus.ENABLED ||
            flow.publishedVersionId !== data.flowVersionId
        ) {


            const flowVersion = await flowVersionService.getOne(data.flowVersionId)
            if (isNil(flowVersion)) {
                await flowQueue.removeRepeatingJob({
                    id: data.flowVersionId,
                })
            }
            else {
                await triggerHooks.disable({
                    projectId: data.projectId,
                    flowVersion,
                    simulate: false,
                    ignoreError: true,
                })
            }
            exceptionHandler.handle(
                new Error(
                    `[repeatableJobConsumer] removing project.id=${data.projectId} instance.flowVersionId=${flow?.publishedVersionId} data.flowVersion.id=${data.flowVersionId}`,
                ),
            )

            return
        }

        if (data.triggerType === TriggerType.PIECE) {
            await consumePieceTrigger(data)
        }
    }
    catch (e) {
        if (
            e instanceof ActivepiecesError &&
            e.error.code === ErrorCode.QUOTA_EXCEEDED
        ) {
            logger.info(
                `[repeatableJobConsumer] removing project.id=${data.projectId} run out of flow quota`,
            )
            await flowService.updateStatus({
                id: data.flowId,
                projectId: data.projectId,
                newStatus: FlowStatus.DISABLED,
            })
        }
        else {
            exceptionHandler.handle(e)
        }
    }
}

const consumePieceTrigger = async (data: RepeatingJobData): Promise<void> => {
    const flowVersion = await flowVersionService.getOneOrThrow(
        data.flowVersionId,
    )

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

export const flowQueueConsumer = {
    consumeOnetimeJob,
    consumeScheduledJobs,
    init: initFlowQueueConsumer,
    close,
}
