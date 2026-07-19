import { isNil, tryCatch } from '@activepieces/core-utils'
import { ConsumeJobRequest } from '@activepieces/shared'
import { Worker as BullMQWorker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'


// worker's RPC timeout is 60s, and drainDelay is 15s, so we can safely set WAITER_TIMEOUT_MS to 40s.
const WAITER_TIMEOUT_MS = 40_000
const ERROR_RETRY_DELAY_MS = 5_000
// getNextJob does not block on an empty queue in manual-dispatch mode, so an empty result must be backed off explicitly to avoid hot-looping Redis.
const EMPTY_POLL_BACKOFF_MS = 250

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
        log.info({ queueName, activePolls }, '[QueueDispatcher] poll started')
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
                    log.info({ queueName, job: { id: job.jobId, type: job.jobData.jobType } }, '[QueueDispatcher] dequeued job')
                    return job
                }
                if (closed) return null
                await sleep(EMPTY_POLL_BACKOFF_MS)
            }
            log.info({ queueName, closed }, '[QueueDispatcher] poll returned no job (timed out or closed)')
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

export { createQueueDispatcher, WAITER_TIMEOUT_MS, ERROR_RETRY_DELAY_MS, EMPTY_POLL_BACKOFF_MS }
