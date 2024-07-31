import { JobType, triggerTimeoutSandbox } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { DefaultJobOptions, Job, Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'

import { createRedisClient } from '../../database/redis-connection'
import { AddParams, JOB_PRIORITY } from '../queue/queue-manager'
import { redisHandler } from '../redis/redis-handler'


const EIGHT_MINUTES_IN_MILLISECONDS = 8 * 60 * 1000
const defaultJobOptions: DefaultJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: EIGHT_MINUTES_IN_MILLISECONDS,
    },
    removeOnComplete: true,
}


let worker: Worker | null = null

let queue: Queue | null = null


export const redisRateLimiter = {

    async init(): Promise<void> {
        if (isNil(queue)) {
            queue = new Queue(
                'rateLimitJobs',
                {
                    connection: createRedisClient(),
                    defaultJobOptions,
                },
            )
            await queue.waitUntilReady()
        }
        if (isNil(worker)) {
            const lockDuration = dayjs.duration(triggerTimeoutSandbox, 'seconds').add(3, 'minutes').asMilliseconds()
            worker = new Worker('rateLimitJobs', null, {
                connection: createRedisClient(),
                lockDuration,
                maxStalledCount: 5,
                drainDelay: 5,
                stalledInterval: 30000,
            })
            await worker.waitUntilReady()
            await worker.startStalledCheckTimer()
        }
    },

    async delayJob(params: AddParams<JobType.WEBHOOK | JobType.ONE_TIME>): Promise<void> {
        if (isNil(queue)) {
            throw new Error('Queue is not initialized')
        }
        const { id, data, priority } = params
        await queue.add(id, data, {
            jobId: id,
            priority: JOB_PRIORITY[priority],
        })

        await redisHandler.push(data.payload.userId, data.payload.jobId)
        const delayedJob = await Job.fromId(queue, id)
        if (isNil(delayedJob)) {
            return
        }
        await delayedJob.changeDelay(1000000000)
    },

    async activeJob(job: Job, activeQueue: Queue): Promise<void> {
        const pulledJobId = await redisHandler.poll(job.data.userId)
        if (isNil(pulledJobId)) {
            return
        }
        if (isNil(worker)) {
            throw new Error('Worker is not initialized')
        }
        const pulledJob = await Job.fromId(worker, pulledJobId)

        if (isNil(pulledJob)) {
            return
        }

        await queue?.remove(pulledJobId)

        await activeQueue.add(pulledJobId, pulledJob.data, {
            jobId: pulledJobId,
            priority: JOB_PRIORITY[pulledJob.data.priority as keyof typeof JOB_PRIORITY],
        })
        
        await pulledJob.changeDelay(0)
    },

}