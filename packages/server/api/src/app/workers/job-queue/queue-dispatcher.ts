import { ConsumeJobRequest, isNil, tryCatch } from '@activepieces/shared'
import { Worker as BullMQWorker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'

const WAITER_TIMEOUT_MS = 50_000
const ERROR_RETRY_DELAY_MS = 5_000

function createQueueDispatcher(params: {
    queueName: string
    worker: BullMQWorker
    dequeue: (worker: BullMQWorker, queueName: string, log: FastifyBaseLogger) => Promise<ConsumeJobRequest | null>
    log: FastifyBaseLogger
}): QueueDispatcher {
    const { queueName, worker, dequeue, log } = params
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
                continue
            }

            const waiter = waiters.shift()
            if (isNil(waiter)) {
                // No waiter left — this shouldn't happen since we check waiters.length,
                // but just in case, log and continue
                log.warn({ queueName }, '[QueueDispatcher] job dequeued but no waiter available')
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
        loopRunning = false
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

export { createQueueDispatcher, WAITER_TIMEOUT_MS, ERROR_RETRY_DELAY_MS }
