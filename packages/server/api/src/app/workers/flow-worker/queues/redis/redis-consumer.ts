import { Worker } from 'bullmq'

import { createRedisClient } from '../../../../database/redis-connection'
import { flowWorkerManager } from '../../consumer/flow-queue-consumer'
import { webhookConsumer } from '../../consumer/webook-consumer'
import { ONE_TIME_JOB_QUEUE, SCHEDULED_JOB_QUEUE, WEBHOOK_JOB_QUEUE } from './redis-queue'
import { system, SystemProp } from '@activepieces/server-shared'
import { ApId } from '@activepieces/shared'
import { OneTimeJobData, ScheduledJobData, WebhookJobData } from 'server-worker'

const workers: Record<string, {
    scheduledJobConsumer: Worker<ScheduledJobData, unknown>,
    oneTimeJobConsumer: Worker<OneTimeJobData, unknown>,
    webhookJobConsumer: Worker<WebhookJobData, unknown>,
}> = {}
const flowConcurrency =
    system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10

export const redisConsumer = {
    async init(workerId: string): Promise<void> {
        if (flowConcurrency === 0) {
            return
        }
        let redisScheduledJobConsumer = new Worker<ScheduledJobData, unknown, ApId>(
            SCHEDULED_JOB_QUEUE,
            async (job) => {
                await flowWorkerManager.consumeScheduledJobs(job.data)
            },
            {
                connection: createRedisClient(),
                concurrency: flowConcurrency,
            },
        )
        let redisWebhookJobConsumer = new Worker<WebhookJobData, unknown, ApId>(
            WEBHOOK_JOB_QUEUE,
            async (job) => {
                await webhookConsumer.consumeWebhook(job.data)
            },
            {
                connection: createRedisClient(),
                concurrency: flowConcurrency,
            },
        )
        let redisOneTimeJobConsumer = new Worker<OneTimeJobData, unknown, ApId>(
            ONE_TIME_JOB_QUEUE,
            async (job) => {
                await flowWorkerManager.consumeOnetimeJob(job.data)
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
        workers[workerId] = {
            scheduledJobConsumer: redisScheduledJobConsumer,
            oneTimeJobConsumer: redisOneTimeJobConsumer,
            webhookJobConsumer: redisWebhookJobConsumer,
        }
    },
    async close(workerId: string): Promise<void> {
        if (flowConcurrency === 0) {
            return
        }
        const { scheduledJobConsumer, oneTimeJobConsumer, webhookJobConsumer } = workers[workerId]
        const startWorkers = [
            webhookJobConsumer.close(),
            oneTimeJobConsumer.close(),
            scheduledJobConsumer.close(),
        ]
        await Promise.all(startWorkers)
    },
}
