import { Job, Worker } from 'bullmq'
import { ActivepiecesError, ApId, ErrorCode, ExecutionType, FlowInstanceStatus, RunEnvironment, TriggerType } from '@activepieces/shared'
import { createRedisClient } from '../../database/redis-connection'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { triggerUtils } from '../../helper/trigger-utils'
import { ONE_TIME_JOB_QUEUE, SCHEDULED_JOB_QUEUE, flowQueue } from './flow-queue'
import { flowWorker } from './flow-worker'
import { DelayedJobData, OneTimeJobData, RepeatingJobData, ScheduledJobData } from './job-data'
import { captureException, logger } from '../../helper/logger'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { flowInstanceService } from '../../flows/flow-instance/flow-instance.service'
import { isNil } from '@activepieces/shared'

const oneTimeJobConsumer = new Worker<OneTimeJobData, unknown, ApId>(
    ONE_TIME_JOB_QUEUE,
    async (job) => {
        logger.info(`[FlowQueueConsumer#oneTimeJobConsumer] job.id=${job.id} flowRunId=${job.data.runId} executionType=${job.data.executionType}`)
        const data = job.data
        return await flowWorker.executeFlow(data)
    },
    {
        connection: createRedisClient(),
        concurrency: system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10,
    },
)

const scheduledJobConsumer = new Worker<ScheduledJobData, unknown, ApId>(
    SCHEDULED_JOB_QUEUE,
    async (job) => {
        logger.info(`[FlowQueueConsumer#scheduledJobConsumer] job.id=${job.id} executionType=${job.data.executionType}`)

        const consumers: Record<ExecutionType, (job: Job) => Promise<void>> = {
            [ExecutionType.BEGIN]: consumeRepeatingJob,
            [ExecutionType.RESUME]: consumeDelayedJob,
        }

        const consumer = consumers[job.data.executionType]

        try {
            await consumer(job)
        }
        catch (e) {
            captureException(e)
        }
    },
    {
        connection: createRedisClient(),
        concurrency: system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10,
    },
)

const consumeDelayedJob = async (job: Job<DelayedJobData, void>): Promise<void> => {
    logger.info(`[FlowQueueConsumer#consumeDelayedJob] flowRunId=${job.data.runId}`)

    const { data } = job

    await flowRunService.start({
        payload: null,
        flowRunId: data.runId,
        projectId: data.projectId,
        flowVersionId: data.flowVersionId,
        executionType: ExecutionType.RESUME,
        environment: RunEnvironment.PRODUCTION,
    })
}

const consumeRepeatingJob = async (job: Job<RepeatingJobData, void>): Promise<void> => {
    const { data } = job

    try {
        // TODO REMOVE AND FIND PERMANENT SOLUTION
        const instance = await flowInstanceService.get({
            projectId: data.projectId,
            flowId: data.flowId,
        })

        if (
            isNil(instance) ||
            instance.status !== FlowInstanceStatus.ENABLED ||
            instance.flowVersionId !== data.flowVersionId
        ) {
            captureException(new Error(`[repeatableJobConsumer] removing job.id=${job.name} instance.flowVersionId=${instance?.flowVersionId} data.flowVersion.id=${data.flowVersionId}`))

            const flowVersion = await flowVersionService.getOneOrThrow(data.flowVersionId)
            if (isNil(flowVersion)) {
                await flowQueue.removeRepeatingJob({
                    id: data.flowVersionId,
                })
            }
            else {
                await triggerUtils.disable({
                    projectId: data.projectId,
                    flowVersion: flowVersion,
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
        if (e instanceof ActivepiecesError && e.error.code === ErrorCode.TASK_QUOTA_EXCEEDED) {
            logger.info(`[repeatableJobConsumer] removing job.id=${job.name} run out of flow quota`)
            await flowInstanceService.update({ projectId: data.projectId, flowId: data.flowId, status: FlowInstanceStatus.DISABLED })
        }
        else {
            captureException(e)
        }
    }
}

const consumePieceTrigger = async (data: RepeatingJobData): Promise<void> => {
    const flowVersion = await flowVersionService.getOneOrThrow(data.flowVersionId)

    const payloads: unknown[] = await triggerUtils.executeTrigger({
        projectId: data.projectId,
        flowVersion: flowVersion,
        payload: {},
        simulate: false,
    })

    logger.info(`[flowQueueConsumer#consumePieceTrigger] payloads.length=${payloads.length}`)

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

export const initFlowQueueConsumer = async (): Promise<void> => {
    const startWorkers = [oneTimeJobConsumer.waitUntilReady(), scheduledJobConsumer.waitUntilReady()]
    await Promise.all(startWorkers)
}


export const closeAllConsumers = async (): Promise<void> => {
    logger.info('[FlowQueueConsumer#closeAllConsumers] closing all consumers')
    const startWorkers = [oneTimeJobConsumer.close(), scheduledJobConsumer.close()]
    await Promise.all(startWorkers)
}
