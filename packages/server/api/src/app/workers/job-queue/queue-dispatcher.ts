import { isNil, tryCatch } from '@activepieces/core-utils'
import { ConsumeJobRequest } from '@activepieces/shared'
import { Worker as BullMQWorker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'


// worker's RPC timeout is 60s, and drainDelay is 15s, so we can safely set WAITER_TIMEOUT_MS to 40s. 
const WAITER_TIMEOUT_MS = 40_000
const ERROR_RETRY_DELAY_MS = 5_000

function createQueueDispatcher(params: {
    queueName: string
    worker: BullMQWorker
    dequeue: (worker: BullMQWorker, queueName: string, log: FastifyBaseLogger) => Promise<ConsumeJobRequest | null>
    log: FastifyBaseLogger
}): QueueDispatcher {
    const { queueName, worker, dequeue, log } = params
    let activePolls = 0
    let closed = false


    async function poll(): Promise<ConsumeJobRequest | null> {
        activePolls++
        try {
            const deadline = Date.now() + WAITER_TIMEOUT_MS
            while (!closed && Date.now() < deadline) {
                const { error, data: job } = await tryCatch(() => dequeue(worker, queueName, log))
                if (error) {
                    if (closed) return null
                    log.error({ queueName, error: String(error) }, '[QueueDispatcher] dequeue error, retrying')
                    await sleep(ERROR_RETRY_DELAY_MS)
                    continue
                }
                if (!isNil(job)) {
                    return job
                }
            }
            return null
        }
        finally {
            activePolls--
        }
    }

    function close(): void {
        closed = true
    }

    function waiterCount(): number {
        return activePolls
    }

    return { poll, close, waiterCount }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export type QueueDispatcher = {
    poll(): Promise<ConsumeJobRequest | null>
    close(): void
    waiterCount(): number
}

export { createQueueDispatcher, WAITER_TIMEOUT_MS, ERROR_RETRY_DELAY_MS }
