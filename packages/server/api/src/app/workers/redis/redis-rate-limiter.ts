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
const PROJECT_RATE_LIMITER_ENABLED = system.getBoolean(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED)
const SUPPORTED_QUEUES = [QueueName.ONE_TIME, QueueName.WEBHOOK]

let redis: Redis
let worker: Worker | null = null
let queue: Queue | null = null

const projecyKey = (projectId: string): string => `active_job_count:${projectId}`

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
                    max: 20,
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
        if (!SUPPORTED_QUEUES.includes(queueName) || !PROJECT_RATE_LIMITER_ENABLED) {
            return
        }
        const redisKey = projecyKey(job.data.projectId)
        await redis.incrby(redisKey, -1)
    },

    async getQueue(): Promise<Queue> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        return queue
    },

    async shouldBeLimited(queueName: QueueName, projectId: string, value: number): Promise<{
        shouldRateLimit: boolean
    }> {
        if (!SUPPORTED_QUEUES.includes(queueName) || !PROJECT_RATE_LIMITER_ENABLED) {
            return {
                shouldRateLimit: false,
            }
        }
        const redisKey = projecyKey(projectId)
        const newActiveRuns = await redis.incrby(redisKey, value)
        await redis.expire(redisKey, 600)
        if (newActiveRuns >= MAX_CONCURRENT_JOBS_PER_PROJECT) {
            await redis.incrby(redisKey, -value)
            return {
                shouldRateLimit: true,
            }
        }
        return {
            shouldRateLimit: false,
        }
    },

}