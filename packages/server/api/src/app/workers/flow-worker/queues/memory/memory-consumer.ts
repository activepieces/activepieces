import dayjs from 'dayjs'
import { flowQueueConsumer } from '../../flow-queue-consumer'
import { OneTimeJobData, ScheduledJobData } from '../../job-data'
import { inMemoryQueueManager } from './memory-queue'
import { logger, system, SystemProp } from '@activepieces/server-shared'

class Semaphore {
    private maxConcurrent: number
    private queue: (() => void)[]
    private currentConcurrent: number

    constructor(maxConcurrent: number) {
        this.maxConcurrent = maxConcurrent
        this.queue = []
        this.currentConcurrent = 0
    }

    async acquire() {
        if (this.currentConcurrent >= this.maxConcurrent) {
            await new Promise<void>((resolve) => this.queue.push(resolve))
        }
        this.currentConcurrent++
    }

    release() {
        this.currentConcurrent--
        if (this.queue.length > 0) {
            const nextResolver = this.queue.shift()
            nextResolver?.()
        }
    }
}

const flowConcurrency =
  system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10

const concurrencySemaphore = new Semaphore(flowConcurrency)

export async function consumeJobsInMemory(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const now = dayjs().unix()

        while (inMemoryQueueManager.queues.ONE_TIME.length > 0) {
            const job = inMemoryQueueManager.queues.ONE_TIME.shift()!
            processOneTimeJob(job.data).catch((e) =>
                logger.error(
                    e,
                    '[MemoryConsumer#consumeJobsInMemory] processOneTimeJob',
                ),
            )
        }

        const delayedJobs = inMemoryQueueManager.queues.DELAYED.filter(
            (job) => job.nextFireEpochSeconds <= now,
        )
        for (const job of delayedJobs) {
            inMemoryQueueManager.queues.DELAYED =
        inMemoryQueueManager.queues.DELAYED.filter((j) => j.id !== job.id)
            processScheduledJob(job.data).catch((e) =>
                logger.error(
                    e,
                    '[MemoryConsumer#consumeJobsInMemory] processScheduledJob',
                ),
            )
        }

        const repeatedJob = inMemoryQueueManager.queues.REPEATING.filter(
            (job) => job.nextFireEpochMsAt <= now,
        )
        for (const job of repeatedJob) {
            inMemoryQueueManager.queues.REPEATING =
        inMemoryQueueManager.queues.REPEATING.filter((j) => j.id !== job.id)
            processScheduledJob(job.data).catch((e) =>
                logger.error(
                    e,
                    '[MemoryConsumer#consumeJobsInMemory] processScheduledJob',
                ),
            )
            inMemoryQueueManager
                .add(job)
                .catch((e) =>
                    logger.error(
                        e,
                        '[MemoryConsumer#consumeJobsInMemory] inMemoryQueueManager.add',
                    ),
                )
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
    }
}

async function processOneTimeJob(data: OneTimeJobData): Promise<void> {
    await concurrencySemaphore.acquire()
    try {
        await flowQueueConsumer.consumeOnetimeJob(data)
    }
    finally {
        concurrencySemaphore.release()
    }
}

async function processScheduledJob(data: ScheduledJobData): Promise<void> {
    await concurrencySemaphore.acquire()
    try {
        await flowQueueConsumer.consumeScheduledJobs(data)
    }
    finally {
        concurrencySemaphore.release()
    }
}
