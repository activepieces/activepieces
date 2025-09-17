import { AppSystemProp } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, assertNull, ExecuteFlowJobData, isNil, JobData, WorkerJobType } from '@activepieces/shared'
import { Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'

import { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'
import { createRedisClient, getRedisConnection } from '../../database/redis-connection'
import { apDayjsDuration } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { AddJobParams, JobType, RATE_LIMIT_PRIORITY } from '../queue/queue-manager'
import { redisQueue } from './redis-queue'


export const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]

const RATE_LIMIT_QUEUE_NAME = 'rateLimitJobs'
const MAX_CONCURRENT_JOBS_PER_PROJECT = system.getNumberOrThrow(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT)
const PROJECT_RATE_LIMITER_ENABLED = system.getBoolean(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED)
const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const FLOW_TIMEOUT_IN_MILLISECONDS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS), 'seconds').add(1, 'minute').asMilliseconds()

let redis: Redis
let worker: Worker | null = null
let queue: Queue | null = null

const projectSetKey = (projectId: string): string => `active_jobs_set:${projectId}`

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

        worker = new Worker<AddJobParams<JobType>>(RATE_LIMIT_QUEUE_NAME,
            async (job) => redisQueue(log).add({
                ...job.data,
                priority: RATE_LIMIT_PRIORITY,
            })
            , {
                connection: createRedisClient(),
                maxStalledCount: 5,
                concurrency: 5,
            })
        await worker.waitUntilReady()
    },

    async rateLimitJob(params: AddJobParams<JobType>): Promise<void> {
        assertNotNullOrUndefined(queue, 'Queue is not initialized')
        await queue.add(params.id, params, {
            delay: dayjs.duration(15, 'seconds').asMilliseconds(),
        })
    },

    async onCompleteOrFailedJob(data: JobData, jobId: string | undefined): Promise<void> {
        if (!RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType) || !PROJECT_RATE_LIMITER_ENABLED || isNil(jobId)) {
            return
        }
        const castedJob = data as ExecuteFlowJobData

        const setKey = projectSetKey(castedJob.projectId)

        await redis.eval(`
        local setKey = KEYS[1]
        local jobId = ARGV[1]
        
        -- Get all members of the set
        local members = redis.call('SMEMBERS', setKey)
        
        -- Find and remove the job entry that starts with jobId:
        for i = 1, #members do
            local member = members[i]
            if string.match(member, '^' .. jobId .. ':') then
                redis.call('SREM', setKey, member)
            end
        end
        
        return 1
            `,
        1,
        setKey,
        jobId,
        )
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
        const currentTime = Date.now()
        const jobWithTimestamp = `${jobId}:${currentTime}`

        const result = await redis.eval(
            `
    local setKey = KEYS[1]
    local currentTime = tonumber(ARGV[1])
    local timeoutMs = tonumber(ARGV[2])
    local maxJobs = tonumber(ARGV[3])
    local newJobEntry = ARGV[4]
    
    -- Get all members of the set
    local members = redis.call('SMEMBERS', setKey)
    
    -- Clean up old jobs
    for i = 1, #members do
        local member = members[i]
        local timestamp = string.match(member, ':(%d+)$')
        if timestamp and (currentTime - tonumber(timestamp)) > timeoutMs then
            redis.call('SREM', setKey, member)
        end
    end
    
    -- Check current size after cleanup
    local currentSize = redis.call('SCARD', setKey)
    
    if currentSize >= maxJobs then
        return { 1, currentSize }  -- Should rate limit
    end
    
    -- Add new job with timestamp
    redis.call('SADD', setKey, newJobEntry)
    redis.call('EXPIRE', setKey, math.ceil(timeoutMs / 1000))
    
    return { 0, currentSize + 1 }  -- Should not rate limit
`,
            1,
            setKey,
            currentTime.toString(),
            FLOW_TIMEOUT_IN_MILLISECONDS.toString(),
            MAX_CONCURRENT_JOBS_PER_PROJECT.toString(),
            jobWithTimestamp,
        ) as [number, number]

        const [shouldRateLimit] = result

        return {
            shouldRateLimit: shouldRateLimit === 1,
        }
    },

})