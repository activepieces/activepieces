import { ApId, isNil } from '@activepieces/shared'
import { Queue, Worker, Job } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, SystemProp, logger, system } from 'server-shared'

type SystemJobData = {
    name: string
    data: Record<string, never>
}

const useRedis = system.get(SystemProp.QUEUE_MODE) === QueueMode.REDIS

type SystemJobHandler = (data: Job<SystemJobData, unknown>) => Promise<void>

let systemJobsQueue: Queue<SystemJobData, unknown>
const SYSTEM_JOB_QUEUE = 'system-job-queue'

const handlers: Record<string, SystemJobHandler> = {}

export const redisSystemJob = {
    async init(): Promise<void> {
        if (!useRedis) {
            return
        }
        systemJobsQueue = new Queue<SystemJobData, unknown, ApId>(
            SYSTEM_JOB_QUEUE,
            {
                connection: createRedisClient(),
                defaultJobOptions: {
                    attempts: 10,
                    backoff: {
                        type: 'exponential',
                        delay: 15 * 60 * 1000,
                    },
                },
            },
        )
        await systemJobsQueue.waitUntilReady()

        const systemJobWorker = new Worker<SystemJobData, unknown, ApId>(
            SYSTEM_JOB_QUEUE,
            async (job) => {
                const handlerFn = handlers[job.name]
                logger.info(`Running system job ${job.name}`)
                if (isNil(handlerFn)) {
                    throw new Error(`No handler for job ${job.name}`)
                }
                await handlerFn(job)
            },
            {
                connection: createRedisClient(),
                concurrency: 1,
            },
        )
        await systemJobWorker.waitUntilReady()
    },
    async upsertJob(job: SystemJobData, cron: string, handler: SystemJobHandler): Promise<void> {
        if (!useRedis) {
            return
        }
        const client = await systemJobsQueue.client
        const jobKey = await client.get(job.name)
        handlers[job.name] = handler
        if (isNil(jobKey)) {
            logger.info(`Adding job ${job.name} with cron ${cron} to system job queue`)
            await systemJobsQueue.add(job.name, job, {
                repeat: {
                    pattern: cron,
                    tz: 'UTC',
                },
            })
        }
    },
    async close(): Promise<void> {
        if (isNil(systemJobsQueue)) {
            return
        }
        await systemJobsQueue.close()
    },
}