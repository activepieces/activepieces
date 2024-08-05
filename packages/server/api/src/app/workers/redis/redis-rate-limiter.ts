import { AppSystemProp, exceptionHandler, JobType, logger, OneTimeJobData, QueueName, system, WebhookJobData } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, assertNull, isNil } from '@activepieces/shared'
import { Job, Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'

import { Redis } from 'ioredis'
import { createRedisClient, getRedisConnection } from '../../database/redis-connection'
import { AddParams } from '../queue/queue-manager'
import { redisQueue } from './redis-queue'

const RATE_LIMIT_QUEUE_NAME = 'rateLimitJobs'
const PROJECT_RATE_LIMIT = system.getNumberOrThrow(AppSystemProp.PROJECT_RATE_LIMIT)
const SUPPORTED_QUEUES = [QueueName.ONE_TIME, QueueName.WEBHOOK]

let redis: Redis
let worker: Worker | null = null
let queue: Queue | null = null

async function push(projectId: string, jobId: string): Promise<void> {
    const projectKey = `pending_runs:${projectId}`
    await redis.sadd(projectKey, jobId)
    await redis.expire(projectKey, 600)
    logger.error({ jobId }, '[#redisRateLimiter] push')
}

async function poll(projectId: string): Promise<string | null> {
    const projectKey = `pending_runs:${projectId}`
    const jobId = await redis.spop(projectKey)
    logger.error({ jobId }, '[#redisRateLimiter] poll')
    return jobId
}

export const redisRateLimiter = {

    async init(): Promise<void> {
        assertNull(queue, 'queue is not null')
        assertNull(worker, 'worker is not null')
        redis = getRedisConnection()
        queue = new Queue(
            RATE_LIMIT_QUEUE_NAME,
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
        worker = new Worker<AddParams<JobType.ONE_TIME | JobType.WEBHOOK>>(RATE_LIMIT_QUEUE_NAME,
            async (job) => redisQueue.add(job.data, true), {
                connection: createRedisClient(),
                lockDuration: dayjs.duration(30, 'seconds').asMilliseconds(),
                maxStalledCount: 5,
                stalledInterval: 30000,
            })
        await worker.waitUntilReady()
    },

    async rateLimitJob(params: AddParams<JobType>): Promise<void> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        const { id, data } = params
        await queue.add(id, params, {
            jobId: id,
            delay: dayjs.duration(100, 'years').asMilliseconds(),
        })
        await push(data.projectId, id)
    },

    async onCompleteOrFailedJob(queueName: QueueName, job: Job<WebhookJobData | OneTimeJobData>): Promise<void> {
        if (!SUPPORTED_QUEUES.includes(queueName)) {
            return
        }
        const pulledJobId = await poll(job.data.projectId)
        if (isNil(pulledJobId)) {
            await redisRateLimiter.changeTotalRunCount(queueName, job.data.projectId, -1)
            return
        }
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        const pulledJob = await Job.fromId(queue, pulledJobId)
        assertNotNullOrUndefined(pulledJob, 'Pulled job is not found')
        try {
            await pulledJob.changeDelay(0)
        }
        catch (e) {
            exceptionHandler.handle(pulledJobId)
            await push(job.data.projectId, pulledJobId)
        }
    },

    async getQueue(): Promise<Queue> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        return queue
    },

    async changeTotalRunCount(queueName: QueueName, projectId: string, value: number): Promise<{
        shouldRateLimit: boolean
    }> {
        if (!SUPPORTED_QUEUES.includes(queueName)) {
            return {
                shouldRateLimit: false,
            }
        }
        const projectKey = `total_runs:${projectId}`
        const activeRuns = await redis.incrby(projectKey, value)
        return {
            shouldRateLimit: activeRuns >= PROJECT_RATE_LIMIT,
        }
    },

}