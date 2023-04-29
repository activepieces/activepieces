import { Worker } from 'bullmq'
import { ActivepiecesError, ApId, ErrorCode, RunEnvironment, TriggerType } from '@activepieces/shared'
import { createRedisClient } from '../../database/redis-connection'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { triggerUtils } from '../../helper/trigger-utils'
import { ONE_TIME_JOB_QUEUE, REPEATABLE_JOB_QUEUE } from './flow-queue'
import { flowWorker } from './flow-worker'
import { OneTimeJobData, RepeatableJobData } from './job-data'
import { captureException, logger } from '../../helper/logger'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { flowInstanceService } from '../../flows/flow-instance/flow-instance.service'

const oneTimeJobConsumer = new Worker<OneTimeJobData, unknown, ApId>(
    ONE_TIME_JOB_QUEUE,
    async (job) => {
        logger.info(`[oneTimeJobConsumer] job.id=${job.name}`)
        const data = job.data
        return await flowWorker.executeFlow(data)
    },
    {
        connection: createRedisClient(),
        concurrency: system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10,
    },
)

const repeatableJobConsumer = new Worker<RepeatableJobData, unknown, ApId>(
    REPEATABLE_JOB_QUEUE,
    async (job) => {
        logger.info(`[repeatableJobConsumer] job.id=${job.name} job.type=${job.data.triggerType}`)
        const { data } = job

        try {
            if (data.triggerType === TriggerType.PIECE) {
                await consumePieceTrigger(data)
            }
        }
        catch (e) {
            if (e instanceof ActivepiecesError && e.error.code === ErrorCode.TASK_QUOTA_EXCEEDED) {
                logger.info(`[repeatableJobConsumer] removing job.id=${job.name} run out of flow quota`)
                await flowInstanceService.delete({ projectId: data.projectId, flowId: data.flowVersion.flowId })
            }
            else {
                captureException(e)
            }
        }

        logger.info(`[repeatableJobConsumer] done job.id=${job.name} job.type=${job.data.triggerType}`)
    },
    {
        connection: createRedisClient(),
        concurrency: system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10,
    },
)

const consumePieceTrigger = async (data: RepeatableJobData): Promise<void> => {
    const flowVersion = await flowVersionService.getOneOrThrow(data.flowVersion.id)

    const payloads: unknown[] = await triggerUtils.executeTrigger({
        projectId: data.projectId,
        flowVersion: flowVersion,
        payload: null,
        simulate: false,
    })

    logger.info(`[flowQueueConsumer#consumePieceTrigger] payloads.length=${payloads.length}`)

    const createFlowRuns = payloads.map((payload) =>
        flowRunService.start({
            environment: RunEnvironment.PRODUCTION,
            flowVersionId: data.flowVersion.id,
            payload,
        }),
    )

    await Promise.all(createFlowRuns)
}

export const initFlowQueueConsumer = async (): Promise<void> => {
    const startWorkers = [oneTimeJobConsumer.waitUntilReady(), repeatableJobConsumer.waitUntilReady()]
    await Promise.all(startWorkers)
}
