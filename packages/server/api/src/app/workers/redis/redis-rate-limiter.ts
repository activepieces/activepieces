import { AppSystemProp, JobType, OneTimeJobData, QueueName, WebhookJobData } from '@activepieces/server-shared'
import { apId, assertNotNullOrUndefined, assertNull, isNil } from '@activepieces/shared'
import { Job, Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'

import { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'
import { createRedisClient, getRedisConnection } from '../../database/redis-connection'
import { apDayjsDuration } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { AddParams } from '../queue/queue-manager'
import { redisQueue } from './redis-queue'


const RATE_LIMIT_QUEUE_NAME = 'rateLimitJobs'
const CLEANUP_QUEUE_NAME = 'cleanupJobs'
const MAX_CONCURRENT_JOBS_PER_PROJECT = system.getNumberOrThrow(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT)
const PROJECT_RATE_LIMITER_ENABLED = system.getBoolean(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED)
const SUPPORTED_QUEUES = [QueueName.ONE_TIME, QueueName.WEBHOOK]
const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const FLOW_TIMEOUT_IN_MILLISECONDS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS), 'seconds').add(1, 'minute').asMilliseconds()

let redis: Redis
let worker: Worker | null = null
let cleanupWorker: Worker | null = null
let queue: Queue | null = null
let cleanupQueue: Queue | null = null

const projectSetKey = (projectId: string): string => `active_jobs_set:${projectId}`
const cleanupJobId = (projectId: string, jobId: string): string => `cleanup:${projectId}:${jobId}`

export const redisRateLimiter = (log: FastifyBaseLogger) => ({

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
                        delay: EIGHT_MINUTES_IN_MILLISECONDS,
                    },
                    removeOnComplete: true,
                },
            },
        )
        await queue.waitUntilReady()
        
        cleanupQueue = new Queue(
            CLEANUP_QUEUE_NAME,
            {
                connection: createRedisClient(),
                defaultJobOptions: {
                    removeOnComplete: true,
                },
            },
        )
        await cleanupQueue.waitUntilReady()
        
        worker = new Worker<AddParams<JobType.ONE_TIME | JobType.WEBHOOK>>(RATE_LIMIT_QUEUE_NAME,
            async (job) => redisQueue(log).add(job.data)
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
        
        cleanupWorker = new Worker(CLEANUP_QUEUE_NAME, 
            async (job) => {
                const { projectId, jobId } = job.data
                const setKey = projectSetKey(projectId)
                await redis.srem(setKey, jobId)
            }, 
            {
                connection: createRedisClient(),
            },
        )
        await cleanupWorker.waitUntilReady()
    },

    async rateLimitJob(params: AddParams<JobType>): Promise<void> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        const id = apId()
        await queue.add(id, params, {
            jobId: id,
            delay: dayjs.duration(15, 'seconds').asMilliseconds(),
        })
    },

    async onCompleteOrFailedJob(queueName: QueueName, job: Job<WebhookJobData | OneTimeJobData>): Promise<void> {
        if (!SUPPORTED_QUEUES.includes(queueName) || !PROJECT_RATE_LIMITER_ENABLED || isNil(job.id)) {
            return
        }
        assertNotNullOrUndefined(cleanupQueue, 'Cleanup Queue is not initialized')
        await redis.srem(projectSetKey(job.data.projectId), job.id)
    },

    async getCleanUpQueue(): Promise<Queue> {
        assertNotNullOrUndefined(cleanupQueue, 'Cleanup Queue is not initialized')
        return cleanupQueue
    },

    async getQueue(): Promise<Queue> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        return queue
    },

    async shouldBeLimited(projectId: string | undefined, jobId: string): Promise<{
        shouldRateLimit: boolean
    }> {
        if (isNil(projectId) || !PROJECT_RATE_LIMITER_ENABLED) {
            return {
                shouldRateLimit: false,
            }
        }

        const setKey = projectSetKey(projectId)
        const activeJobsCount = await redis.scard(setKey)
        
        if (activeJobsCount >= MAX_CONCURRENT_JOBS_PER_PROJECT) {
            return {
                shouldRateLimit: true,
            }
        }
        
        // Schedule cleanup after 10 minutes as a fallback
        assertNotNullOrUndefined(cleanupQueue, 'Cleanup Queue is not initialized')
        await cleanupQueue.add(cleanupJobId(projectId, jobId), { projectId, jobId }, {
            delay: FLOW_TIMEOUT_IN_MILLISECONDS,
        })

        // Add job to the set
        await redis.sadd(setKey, jobId)
        
        // Make the set expire after the flow timeout
        await redis.expire(setKey, Math.ceil(FLOW_TIMEOUT_IN_MILLISECONDS / 1000))

        return {
            shouldRateLimit: false,
        }
    },

})