import {
    ActivepiecesError,
    ErrorCode,
    ExecutionType,
    FlowStatus,
    RunEnvironment,
    TriggerPayload,
    TriggerType,
} from '@activepieces/shared'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { triggerUtils } from '../../helper/trigger-utils'
import { flowQueue } from './flow-queue'
import { flowWorker } from './flow-worker'
import {
    DelayedJobData,
    OneTimeJobData,
    RepeatingJobData,
    ScheduledJobData,
} from './job-data'
import { captureException, logger } from '../../helper/logger'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { isNil } from '@activepieces/shared'
import { consumeJobsInMemory } from './queues/memory/memory-consumer'
import { inMemoryQueueManager } from './queues/memory/memory-queue'
import { redisConsumer } from './queues/redis/redis-consumer'
import { redisQueueManager } from './queues/redis/redis-queue'
import { QueueMode, system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { enrichErrorContext } from '../../helper/error-handler'
import { flowService } from '../../flows/flow/flow.service'

const queueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)

const initFlowQueueConsumer = async (): Promise<void> => {
    switch (queueMode) {
        case QueueMode.MEMORY: {
            await inMemoryQueueManager.init()
            consumeJobsInMemory()
                .catch((e) => logger.error(e, '[FlowQueueConsumer#init] consumeJobsInMemory'))
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
        switch (data.executionType) {
            case ExecutionType.BEGIN:
                await consumeRepeatingJob(data)
                break
            case ExecutionType.RESUME:
                await consumeDelayedJob(data)
                break
        }
    }
    catch (e) {
        captureException(e)
    }
}

const consumeDelayedJob = async (data: DelayedJobData): Promise<void> => {
    logger.info(`[FlowQueueConsumer#consumeDelayedJob] flowRunId=${data.runId}`)

    await flowRunService.start({
        payload: null,
        flowRunId: data.runId,
        projectId: data.projectId,
        flowVersionId: data.flowVersionId,
        executionType: ExecutionType.RESUME,
        environment: RunEnvironment.PRODUCTION,
    })
}

const consumeRepeatingJob = async (data: RepeatingJobData): Promise<void> => {
    try {
        // TODO REMOVE AND FIND PERMANENT SOLUTION
        const flow = await flowService.getOne({
            id: data.flowId,
            projectId: data.projectId,
        })

        if (isNil(flow) ||
            flow.status !== FlowStatus.ENABLED ||
            flow.publishedVersionId !== data.flowVersionId
        ) {
            captureException(
                new Error(
                    `[repeatableJobConsumer] removing project.id=${data.projectId} instance.flowVersionId=${flow?.publishedVersionId} data.flowVersion.id=${data.flowVersionId}`,
                ),
            )

            const flowVersion = await flowVersionService.getOne(data.flowVersionId)
            if (isNil(flowVersion)) {
                await flowQueue.removeRepeatingJob({
                    id: data.flowVersionId,
                })
            }
            else {
                await triggerUtils.disable({
                    projectId: data.projectId,
                    flowVersion,
                    simulate: false,
                })
            }

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
            captureException(e)
        }
    }
}

const consumePieceTrigger = async (data: RepeatingJobData): Promise<void> => {
    const flowVersion = await flowVersionService.getOneOrThrow(
        data.flowVersionId,
    )

    const payloads: unknown[] = await triggerUtils.executeTrigger({
        projectId: data.projectId,
        flowVersion,
        payload: {} as TriggerPayload,
        simulate: false,
    })

    logger.info(
        `[flowQueueConsumer#consumePieceTrigger] payloads.length=${payloads.length}`,
    )

    const createFlowRuns = payloads.map((payload) =>
        flowRunService.start({
            environment: RunEnvironment.PRODUCTION,
            flowVersionId: data.flowVersionId,
            payload,
            projectId: data.projectId,
            executionType: ExecutionType.BEGIN,
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
