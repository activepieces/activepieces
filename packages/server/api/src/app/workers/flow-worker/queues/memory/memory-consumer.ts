import { flowQueueConsumer } from '../../consumer/flow-queue-consumer'
import { webhookConsumer } from '../../consumer/webook-consumer'
import { memoryQueueManager } from './memory-queue'
import { ApSemaphore, system, SystemProp } from '@activepieces/server-shared'

const flowConcurrency =
    system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10

const concurrencySemaphore = new ApSemaphore(flowConcurrency)

async function processJob<T>(data: T, consumeFunction: (data: T) => Promise<void>) {
    await concurrencySemaphore.acquire()
    try {
        await consumeFunction(data)
    }
    finally {
        concurrencySemaphore.release()
    }
}

export async function consumeJobsInMemory(): Promise<void> {
    memoryQueueManager.getOneTimeQueue().start(async (job) => {
        await processJob(job.data.data, flowQueueConsumer.consumeOnetimeJob)
    })
    memoryQueueManager.getRepeatingQueue().start(async (job) => {
        await processJob(job.data.data, flowQueueConsumer.consumeScheduledJobs)
    })
    memoryQueueManager.getDelayedQueue().start(async (job) => {
        await processJob(job.data.data, flowQueueConsumer.consumeScheduledJobs)
    })
    memoryQueueManager.getWebhookQueue().start(async (job) => {
        await processJob(job.data.data, webhookConsumer.consumeWebhook)
    })
}
