import { Worker } from 'bullmq'

import { createRedisClient } from '../../../../database/redis-connection'
import { flowQueueConsumer } from '../../flow-queue-consumer'
import { OneTimeJobData, ScheduledJobData } from '../../job-data'
import { ONE_TIME_JOB_QUEUE, SCHEDULED_JOB_QUEUE } from './redis-queue'
import { SystemProp, system } from '@activepieces/server-shared'
import { ApId } from '@activepieces/shared'

let redisScheduledJobConsumer: Worker<ScheduledJobData, unknown>
let redisOneTimeJobConsumer: Worker<OneTimeJobData, unknown>
const flowConcurrency =
  system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10

export const redisConsumer = {
    async init(): Promise<void> {
        if (flowConcurrency === 0) {
            return
        }
        redisScheduledJobConsumer = new Worker<ScheduledJobData, unknown, ApId>(
            SCHEDULED_JOB_QUEUE,
            async (job) => {
                await flowQueueConsumer.consumeScheduledJobs(job.data)
            },
            {
                connection: createRedisClient(),
                concurrency: flowConcurrency,
            },
        )
        redisOneTimeJobConsumer = new Worker<OneTimeJobData, unknown, ApId>(
            ONE_TIME_JOB_QUEUE,
            async (job) => {
                await flowQueueConsumer.consumeOnetimeJob(job.data)
            },
            {
                connection: createRedisClient(),
                concurrency: flowConcurrency,
            },
        )
        const startWorkers = [
            redisOneTimeJobConsumer.waitUntilReady(),
            redisScheduledJobConsumer.waitUntilReady(),
        ]
        await Promise.all(startWorkers)
    },
    async close(): Promise<void> {
        if (flowConcurrency === 0) {
            return
        }
        const startWorkers = [
            redisOneTimeJobConsumer.close(),
            redisScheduledJobConsumer.close(),
        ]
        await Promise.all(startWorkers)
    },
}
