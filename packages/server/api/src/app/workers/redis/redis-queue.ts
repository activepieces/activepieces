import { exceptionHandler, JobType, logger, QueueName } from '@activepieces/server-shared'
import { ActivepiecesError, ApId, ErrorCode, isNil } from '@activepieces/shared'
import { DefaultJobOptions, Queue } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { AddParams, queueHelper, QueueManager } from '../queue/queue-manager'
import { redisMigrations } from './redis-migration'

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

type ConsumerGroup = Record<string, Queue>
export const bullMqGroups: Record<string, ConsumerGroup> = {}

export const redisQueue: QueueManager = {
    async init(): Promise<void> {
        const queues = Object.values(QueueName).map((queueName) => ensureQueueExists(null, queueName))
        await Promise.all(queues)
        await redisMigrations.run()
        logger.info('[redisQueueManager#init] Redis queues initialized')
    },
    async add(groupId, params): Promise<void> {
        const { type } = params
        switch (type) {
            case JobType.REPEATING: {
                await addRepeatingJob(groupId, params)
                break
            }
            case JobType.DELAYED: {
                await addDelayedJob(groupId, params)
                break
            }
            case JobType.ONE_TIME:{
                const queue = await ensureQueueExists(groupId, QueueName.ONE_TIME)
                await addJobWithPriority(queue, params)
                break
            }
            case JobType.WEBHOOK:{
                const queue = await ensureQueueExists(groupId, QueueName.WEBHOOK)
                await addJobWithPriority(queue, params)
                break
            }
        }
    },
    async removeRepeatingJob(groupId, { id }): Promise<void> {
        const queue = await ensureQueueExists(groupId, QueueName.SCHEDULED)
        const client = await queue.client
        const repeatJobKey = await findRepeatableJobKey(groupId, id)
        if (isNil(repeatJobKey)) {
            exceptionHandler.handle(new Error(`Couldn't find job key for id "${id}"`))
            return
        }
        const result = await queue.removeRepeatableByKey(repeatJobKey)
        if (!result) {
            throw new ActivepiecesError({
                code: ErrorCode.JOB_REMOVAL_FAILURE,
                params: {
                    jobId: id,
                },
            })
        }
        await client.del(repeatingJobKey(id))
    },
}

async function findRepeatableJobKey(groupId: string | null, id: ApId): Promise<string | undefined> {
    const queue = await ensureQueueExists(groupId, QueueName.SCHEDULED)
    const client = await queue.client
    const jobKey = await client.get(repeatingJobKey(id))
    if (isNil(jobKey)) {
        logger.warn({ jobKey: id }, 'Job key not found in redis, trying to find it in the queue')
        // TODO: this temporary solution for jobs that doesn't have repeatJobKey in redis, it's also confusing because it search by flowVersionId
        const jobs = await queue.getJobs()
        return jobs.filter(f => !isNil(f) && !isNil(f.data)).find((f) => f.data.flowVersionId === id)?.repeatJobKey
    }
    return jobKey
}

async function ensureQueueExists(groupId: string | null, queueName: QueueName): Promise<Queue> {
    const key = groupId ?? 'default'
    if (isNil(bullMqGroups[key])) {
        bullMqGroups[key] = {}
    }
    if (!isNil(bullMqGroups[key][queueName])) {
        return bullMqGroups[key][queueName]
    }
    const queueAlias = queueHelper.getQueueName(groupId, queueName)
    bullMqGroups[key][queueName] = new Queue(
        queueAlias,
        {
            connection: createRedisClient(),
            defaultJobOptions,
        },
    )
    await bullMqGroups[key][queueName].waitUntilReady()
    return bullMqGroups[key][queueName]
}

async function addJobWithPriority(queue: Queue, params: AddParams<JobType.WEBHOOK | JobType.ONE_TIME>): Promise<void> {
    const { id, data, priority } = params
    await queue.add(id, data, {
        jobId: id,
        priority: priority === 'high' ? 1 : undefined,
    })
}

async function addDelayedJob(groupId: string | null, params: AddParams<JobType.DELAYED>): Promise<void> {
    const { id, data, delay } = params
    const queue = await ensureQueueExists(groupId, QueueName.SCHEDULED)
    await queue.add(id, data, {
        jobId: id,
        delay,
    })
}

async function addRepeatingJob(groupId: string | null, params: AddParams<JobType.REPEATING>): Promise<void> {
    const { id, data, scheduleOptions } = params
    const queue = await ensureQueueExists(groupId, QueueName.SCHEDULED)
    const job = await queue.add(id, data, {
        jobId: id,
        repeat: {
            pattern: scheduleOptions.cronExpression,
            tz: scheduleOptions.timezone,
        },
    })
    if (isNil(job.repeatJobKey)) {
        return
    }
    const client = await queue.client
    await client.set(repeatingJobKey(id), job.repeatJobKey)
}