import { AppSystemProp, JobType, logger, OneTimeJobData, system, WebhookJobData } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, assertNull, isNil } from '@activepieces/shared'
import { Job, Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'

import { Redis } from 'ioredis'
import { createRedisClient, getRedisConnection } from '../../database/redis-connection'
import { AddParams } from '../queue/queue-manager'
import { redisQueue } from './redis-queue'

const rateLimitQueueName = 'rateLimitJobs'
const PROJECT_RATE_LIMIT = system.getNumberOrThrow(AppSystemProp.PROJECT_RATE_LIMIT)

let redis: Redis
let worker: Worker | null = null
let queue: Queue | null = null

async function push(projectId: string, jobId: string): Promise<void> {
    const projectKey = `pending_runs:${projectId}`
    await redis.sadd(projectKey, jobId)
    await redis.expire(projectKey, 600)
}

async function poll(projectId: string): Promise<string | null> {
    const projectKey = `pending_runs:${projectId}`
    const jobId = await redis.spop(projectKey)
    logger.error({ jobId }, 'poll')
    return jobId
}

export const redisRateLimiter = {

    async init(): Promise<void> {
        assertNull(queue, 'queue is not null')
        assertNull(worker, 'worker is not null')

        redis = getRedisConnection()

        queue = new Queue(
            rateLimitQueueName,
            {
                connection: createRedisClient(),
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 8 * 60 * 1000,
                    },
                    removeOnComplete: true,
                },
            },
        )
        await queue.waitUntilReady()
        worker = new Worker<AddParams<JobType.ONE_TIME | JobType.WEBHOOK>>(rateLimitQueueName, async (job) => {
            await redisQueue.add(job.data)
        }, {
            connection: createRedisClient(),
            lockDuration: dayjs.duration(30, 'seconds').asMilliseconds(),
            maxStalledCount: 5,
            stalledInterval: 30000,
        })
        await worker.waitUntilReady()
    },

    async rateLimitJob(params: AddParams<JobType.WEBHOOK | JobType.ONE_TIME>): Promise<void> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        const { id, data } = params
        await queue.add(id, params, {
            jobId: id,
            delay: dayjs.duration(100, 'years').asMilliseconds(),
        })
        await push(data.projectId, id)
    },

    async onCompleteOrFailedJob(job: Job<WebhookJobData | OneTimeJobData>): Promise<void> {
        await redisRateLimiter.changeActiveCount(job.data.projectId, -1)
        const pulledJobId = await poll(job.data.projectId)
        if (isNil(pulledJobId)) {
            return
        }

        assertNotNullOrUndefined(worker, 'Worker is not initialized')
        const pulledJob = await Job.fromId(worker, pulledJobId)
        assertNotNullOrUndefined(pulledJob, 'Pulled job is not found')
        await pulledJob.changeDelay(0)
    },

    async getQueue(): Promise<Queue> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        return queue
    },

    async shouldBeLimited(projectId: string): Promise<boolean> {
        const projectKey = `active_runs:${projectId}`
        const activeRuns = await redis.incrby(projectKey, 0)
        logger.error({ activeRuns, PROJECT_RATE_LIMIT }, 'shouldBeLimited')
        return activeRuns > PROJECT_RATE_LIMIT
    },
    async changeActiveCount(projectId: string, value: number): Promise<void> {
        const projectKey = `active_runs:${projectId}`
        await redis.incrby(projectKey, value)
        await redis.expire(projectKey, 600)
    },
}