import { ConsumeJobRequest, isNil, tryCatch } from '@activepieces/shared'
import { Worker as BullMQWorker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'

const WAITER_TIMEOUT_MS = 50_000
const ERROR_RETRY_DELAY_MS = 5_000
const MAX_MULTI_QUEUE_COUNT = 3

function createQueueDispatcher(params: {
    queueName: string
    worker: BullMQWorker
    dequeue: (worker: BullMQWorker, queueName: string, log: FastifyBaseLogger) => Promise<ConsumeJobRequest | null>
    onOrphanedJob: (jobId: string, token: string, queueName: string, log: FastifyBaseLogger) => Promise<void>
    log: FastifyBaseLogger
}): QueueDispatcher {
    const { queueName, worker, dequeue, onOrphanedJob, log } = params
    const waiters: Waiter[] = []
    let loopRunning = false

    async function poll(): Promise<ConsumeJobRequest | null> {
        return new Promise<ConsumeJobRequest | null>((resolve) => {
            const timer = setTimeout(() => {
                const idx = waiters.findIndex(w => w.resolve === resolve)
                if (idx !== -1) {
                    waiters.splice(idx, 1)
                }
                resolve(null)
            }, WAITER_TIMEOUT_MS)

            waiters.push({ resolve, timer })
            startLoop()
        })
    }

    function startLoop(): void {
        if (loopRunning) return
        loopRunning = true
        void runLoop()
    }

    async function runLoop(): Promise<void> {
        while (waiters.length > 0) {
            const { error, data: job } = await tryCatch(() => dequeue(worker, queueName, log))

            if (error) {
                log.error({ queueName, error: String(error) }, '[QueueDispatcher] dequeue error, retrying')
                await sleep(ERROR_RETRY_DELAY_MS)
                continue
            }

            if (isNil(job)) {
                if (waiters.length === 0) break
                continue
            }

            const waiter = waiters.shift()
            if (isNil(waiter)) {
                log.warn({ queueName, jobId: job.jobId }, '[QueueDispatcher] job dequeued but no waiter available, returning to queue')
                const { error: orphanError } = await tryCatch(() => onOrphanedJob(job.jobId, job.token, job.queueName, log))
                if (orphanError) {
                    log.error({ queueName, jobId: job.jobId, error: String(orphanError) }, '[QueueDispatcher] failed to return orphaned job to queue')
                }
                continue
            }

            clearTimeout(waiter.timer)
            waiter.resolve(job)
        }
        loopRunning = false
    }

    function close(): void {
        for (const waiter of waiters) {
            clearTimeout(waiter.timer)
            waiter.resolve(null)
        }
        waiters.length = 0
    }

    return { poll, close, waiterCount }
}

function createMultiQueueDispatcher(params: {
    queueConfigs: Array<{ queueName: string, worker: BullMQWorker }>
    dequeue: (worker: BullMQWorker, queueName: string, log: FastifyBaseLogger) => Promise<ConsumeJobRequest | null>
    onOrphanedJob: (jobId: string, token: string, queueName: string, log: FastifyBaseLogger) => Promise<void>
    log: FastifyBaseLogger
}): QueueDispatcher {
    const { queueConfigs: rawQueueConfigs, dequeue, onOrphanedJob, log } = params
    if (rawQueueConfigs.length > MAX_MULTI_QUEUE_COUNT) {
        log.warn(
            { queueCount: rawQueueConfigs.length, maxQueueCount: MAX_MULTI_QUEUE_COUNT },
            `[QueueDispatcher] Multi-queue dispatcher supports at most ${MAX_MULTI_QUEUE_COUNT} queues, but ${rawQueueConfigs.length} were provided. Only the first ${MAX_MULTI_QUEUE_COUNT} will be polled.`,
        )
    }
    const queueConfigs = rawQueueConfigs.slice(0, MAX_MULTI_QUEUE_COUNT)
    const waiters: Waiter[] = []
    let loopRunning = false
    let roundRobinIndex = 0

    async function poll(): Promise<ConsumeJobRequest | null> {
        return new Promise<ConsumeJobRequest | null>((resolve) => {
            const timer = setTimeout(() => {
                const idx = waiters.findIndex(w => w.resolve === resolve)
                if (idx !== -1) {
                    waiters.splice(idx, 1)
                }
                resolve(null)
            }, WAITER_TIMEOUT_MS)

            waiters.push({ resolve, timer })
            startLoop()
        })
    }

    function startLoop(): void {
        if (loopRunning) return
        loopRunning = true
        void runLoop()
    }

    async function runLoop(): Promise<void> {
        while (waiters.length > 0) {
            const config = queueConfigs[roundRobinIndex % queueConfigs.length]
            roundRobinIndex++

            const { error, data: job } = await tryCatch(() => dequeue(config.worker, config.queueName, log))

            if (error) {
                log.error({ queueName: config.queueName, error: String(error) }, '[QueueDispatcher] dequeue error, retrying')
                await sleep(ERROR_RETRY_DELAY_MS)
                continue
            }

            if (isNil(job)) {
                if (waiters.length === 0) break
                continue
            }

            const waiter = waiters.shift()
            if (isNil(waiter)) {
                log.warn({ queueName: config.queueName, jobId: job.jobId }, '[QueueDispatcher] job dequeued but no waiter available, returning to queue')
                const { error: orphanError } = await tryCatch(() => onOrphanedJob(job.jobId, job.token, job.queueName, log))
                if (orphanError) {
                    log.error({ queueName: config.queueName, jobId: job.jobId, error: String(orphanError) }, '[QueueDispatcher] failed to return orphaned job to queue')
                }
                continue
            }

            clearTimeout(waiter.timer)
            waiter.resolve(job)
        }
        loopRunning = false
    }

    function close(): void {
        for (const waiter of waiters) {
            clearTimeout(waiter.timer)
            waiter.resolve(null)
        }
        waiters.length = 0
    }

    function waiterCount(): number {
        return waiters.length
    }

    return { poll, close, waiterCount }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

type Waiter = {
    resolve: (value: ConsumeJobRequest | null) => void
    timer: ReturnType<typeof setTimeout>
}

export type QueueDispatcher = {
    poll(): Promise<ConsumeJobRequest | null>
    close(): void
    waiterCount(): number
}

export { createQueueDispatcher, createMultiQueueDispatcher, WAITER_TIMEOUT_MS, ERROR_RETRY_DELAY_MS }
