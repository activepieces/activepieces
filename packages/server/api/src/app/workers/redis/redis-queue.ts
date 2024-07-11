import { exceptionHandler, JobType, logger, QueueName } from '@activepieces/server-shared'
import { ActivepiecesError, ApId, ErrorCode, isNil } from '@activepieces/shared'
import { DefaultJobOptions, Job, Queue } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { AddParams, QueueManager } from '../queue/queue-manager'
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

export const bullMqGroups: Record<string, Queue> = {}

export const redisQueue: QueueManager = {
    async init(): Promise<void> {
        const queues = Object.values(QueueName).map((queueName) => ensureQueueExists(queueName))
        await Promise.all(queues)
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
            case JobType.ONE_TIME: {
                const queue = await ensureQueueExists(QueueName.ONE_TIME)
                await addJobWithPriority(queue, params)
                break
            }
            case JobType.WEBHOOK: {
                const queue = await ensureQueueExists(QueueName.WEBHOOK)
                await addJobWithPriority(queue, params)
                break
            }
        }
    },
    async removeRepeatingJob({ flowVersionId }): Promise<void> {
        const queue = await ensureQueueExists(QueueName.SCHEDULED)
        const client = await queue.client
        const repeatJob = await findRepeatableJobKey(flowVersionId)
        if (isNil(repeatJob)) {
            exceptionHandler.handle(new Error(`Couldn't find job key for flow version id "${flowVersionId}"`))
            return
        }
        const result = await queue.removeRepeatable(repeatJob.name, repeatJob.opts)
        if (!result) {
            throw new ActivepiecesError({
                code: ErrorCode.JOB_REMOVAL_FAILURE,
                params: {
                    flowVersionId,
                },
            })
        }
        await client.del(repeatingJobKey(flowVersionId))
    },
}

async function findRepeatableJobKey(flowVersionId: ApId): Promise<Job | undefined> {
    const queue = await ensureQueueExists(QueueName.SCHEDULED)
    const client = await queue.client
    const jobKey = await client.get(repeatingJobKey(flowVersionId))
    if (isNil(jobKey)) {
        logger.warn({ flowVersionId }, 'Job key not found in redis, trying to find it in the queue')
        // TODO: this temporary solution for jobs that doesn't have repeatJobKey in redis, it's also confusing because it search by flowVersionId
        const jobs = await queue.getJobs()
        return jobs.filter(f => !isNil(f) && !isNil(f.data)).find((f) => f.data.flowVersionId === flowVersionId)
    }
    return undefined
}

async function ensureQueueExists(queueName: QueueName): Promise<Queue> {
    if (!isNil(bullMqGroups[queueName])) {
        return bullMqGroups[queueName]
    }
    bullMqGroups[queueName] = new Queue(
        queueName,
        {
            connection: createRedisClient(),
            defaultJobOptions,
        },
    )
    await bullMqGroups[queueName].waitUntilReady()
    return bullMqGroups[queueName]
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
    const queue = await ensureQueueExists(QueueName.SCHEDULED)
    await queue.add(id, data, {
        jobId: id,
        delay,
    })
}

async function addRepeatingJob(params: AddParams<JobType.REPEATING>): Promise<void> {
    const { id, data, scheduleOptions } = params
    const queue = await ensureQueueExists(QueueName.SCHEDULED)
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