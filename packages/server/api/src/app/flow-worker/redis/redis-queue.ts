import { DefaultJobOptions, Queue } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { AddParams, QueueManager } from '../queue/queue-manager'
import { redisMigrations } from './redis-migration'
import { exceptionHandler, JobType, logger, QueueName } from '@activepieces/server-shared'
import { ActivepiecesError, ApId, ErrorCode, isNil } from '@activepieces/shared'

const EIGHT_MINUTES_IN_MILLISECONDS = 8 * 60 * 1000
const defaultJobOptions: DefaultJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: EIGHT_MINUTES_IN_MILLISECONDS,
    },
    removeOnComplete: true,
}
const repeatingJobKey = (id: ApId): string => `activepieces:repeatJobKey:${id}`

export const bullmqQueues: Record<string, Queue> = {}

export const redisQueue: QueueManager = {
    async init(): Promise<void> {
        for (const queueName of Object.values(QueueName)) {
            bullmqQueues[queueName] = new Queue(
                queueName,
                {
                    connection: createRedisClient(),
                    defaultJobOptions,
                },
            )
        }
        await Promise.all(Object.values(bullmqQueues).map((queue) => queue.waitUntilReady()))
        await redisMigrations.run()
        logger.info('[redisQueueManager#init] Redis queues initialized')
    },
    async add(params): Promise<void> {
        const { type } = params
        switch (type) {
            case JobType.REPEATING: {
                await addRepeatingJob(params)
                break
            }
            case JobType.DELAYED: {
                await addDelayedJob(params)
                break
            }
            case JobType.ONE_TIME:
                await addJobWithPriority(bullmqQueues[QueueName.ONE_TIME], params)
                break
            case JobType.WEBHOOK:
                await addJobWithPriority(bullmqQueues[QueueName.WEBHOOK], params)
                break
        }
    },
    async removeRepeatingJob({ id }): Promise<void> {
        const client = await bullmqQueues[QueueName.SCHEDULED].client
        const repeatJobKey = await client.get(repeatingJobKey(id))
        if (isNil(repeatJobKey)) {
            exceptionHandler.handle(new Error(`Couldn't find job key for id "${id}"`))
            return
        }
        const result = await bullmqQueues[QueueName.SCHEDULED].removeRepeatableByKey(repeatJobKey)
        await client.del(repeatingJobKey(id))

        if (!result) {
            throw new ActivepiecesError({
                code: ErrorCode.JOB_REMOVAL_FAILURE,
                params: {
                    jobId: id,
                },
            })
        }
    },
}

async function addJobWithPriority(queue: Queue, params: AddParams<JobType.WEBHOOK | JobType.ONE_TIME>): Promise<void> {
    const { id, data, priority } = params
    await queue.add(id, data, {
        jobId: id,
        priority: priority === 'high' ? 1 : undefined,
    })
}
async function addDelayedJob(params: AddParams<JobType.DELAYED>): Promise<void> {
    const { id, data, delay } = params
    await bullmqQueues[QueueName.SCHEDULED].add(id, data, {
        jobId: id,
        delay,
    })
}

async function addRepeatingJob(params: AddParams<JobType.REPEATING>): Promise<void> {
    const { id, data, scheduleOptions } = params
    const job = await bullmqQueues[QueueName.SCHEDULED].add(id, data, {
        jobId: id,
        repeat: {
            pattern: scheduleOptions.cronExpression,
            tz: scheduleOptions.timezone,
        },
    })
    if (isNil(job.repeatJobKey)) {
        return
    }
    const client = await bullmqQueues[QueueName.SCHEDULED].client
    await client.set(repeatingJobKey(id), job.repeatJobKey)
}