import { Worker } from 'bullmq'

import { createRedisClient } from '../../../../database/redis-connection'
import { flowQueueConsumer } from '../../consumer/flow-queue-consumer'
import { webhookConsumer } from '../../consumer/webook-consumer'
import { ONE_TIME_JOB_QUEUE, SCHEDULED_JOB_QUEUE, WEBHOOK_JOB_QUEUE } from './redis-queue'
import { system, SystemProp } from '@activepieces/server-shared'
import { ApId } from '@activepieces/shared'
import { OneTimeJobData, ScheduledJobData, WebhookJobData } from 'server-worker'

let redisScheduledJobConsumer: Worker<ScheduledJobData, unknown>
let redisOneTimeJobConsumer: Worker<OneTimeJobData, unknown>
let redisWebhookJobConsumer: Worker<WebhookJobData, unknown>
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
        redisWebhookJobConsumer = new Worker<WebhookJobData, unknown, ApId>(
            WEBHOOK_JOB_QUEUE, 
            async (job) => {
                await webhookConsumer.consumeWebhook(job.data)
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
            redisWebhookJobConsumer.waitUntilReady(),
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
            redisWebhookJobConsumer.close(),
            redisOneTimeJobConsumer.close(),
            redisScheduledJobConsumer.close(),
        ]
        await Promise.all(startWorkers)
    },
}
