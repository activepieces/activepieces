import { AppSystemProp, JobType, OneTimeJobData, QueueName, system, WebhookJobData } from '@activepieces/server-shared'
import { apId, assertNotNullOrUndefined, assertNull } from '@activepieces/shared'
import { Job, Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'

import { Redis } from 'ioredis'
import { createRedisClient, getRedisConnection } from '../../database/redis-connection'
import { AddParams } from '../queue/queue-manager'
import { redisQueue } from './redis-queue'


const RATE_LIMIT_QUEUE_NAME = 'rateLimitJobs'
const MAX_CONCURRENT_JOBS_PER_PROJECT = system.getNumberOrThrow(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT)
const SUPPORTED_QUEUES = [QueueName.ONE_TIME, QueueName.WEBHOOK]

let redis: Redis
let worker: Worker | null = null
let queue: Queue | null = null

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
            async (job) => redisQueue.add(job.data)
            , {
                connection: createRedisClient(),
                maxStalledCount: 5,
                stalledInterval: 30000,
                limiter: {
                    max: 10,
                    duration: 1000,
                },
            })
        await worker.waitUntilReady()
    },

    async rateLimitJob(params: AddParams<JobType>): Promise<void> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        const id = apId()
        await queue.add(id, params, {
            jobId: id,
            delay: dayjs.duration(3, 'seconds').asMilliseconds(),
        })
    },

    async onCompleteOrFailedJob(queueName: QueueName, job: Job<WebhookJobData | OneTimeJobData>): Promise<void> {
        if (!SUPPORTED_QUEUES.includes(queueName)) {
            return
        }
        await redisRateLimiter.changeActiveRunCount(queueName, job.data.projectId, -1)
    },

    async getQueue(): Promise<Queue> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        return queue
    },

    async changeActiveRunCount(queueName: QueueName, projectId: string, value: number): Promise<{
        shouldRateLimit: boolean
    }> {
        if (!SUPPORTED_QUEUES.includes(queueName)) {
            return {
                shouldRateLimit: false,
            }
        }
        const projectKey = `active_runs:${projectId}`
        const newActiveRuns = await redis.incrby(projectKey, value)
        if (newActiveRuns >= MAX_CONCURRENT_JOBS_PER_PROJECT) {
            await redis.incrby(projectKey, -value)
            return {
                shouldRateLimit: true,
            }
        }

        return {
            shouldRateLimit: false,
        }
    },

}