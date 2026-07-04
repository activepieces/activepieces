import { ConsumeJobRequest } from '@activepieces/shared'
import { Worker as BullMQWorker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueueDispatcher, ERROR_RETRY_DELAY_MS, QueueDispatcher, WAITER_TIMEOUT_MS } from '../../../../../src/app/workers/job-queue/queue-dispatcher'

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

const mockWorker = {} as BullMQWorker

function createFakeJob(id: string): ConsumeJobRequest {
    return {
        jobId: id,
        jobData: {} as ConsumeJobRequest['jobData'],
        attempsStarted: 0,
        engineToken: 'token',
        token: 'job-token',
        queueName: 'test-queue',
    }
}

describe('QueueDispatcher', () => {
    let dispatcher: QueueDispatcher
    let dequeueMock: ReturnType<typeof vi.fn>
    let dequeueCallCount: number
    let pendingDequeues: Array<{
        resolve: (value: ConsumeJobRequest | null) => void
        reject: (error: Error) => void
    }>

    beforeEach(() => {
        vi.useFakeTimers()
        dequeueCallCount = 0
        pendingDequeues = []

        dequeueMock = vi.fn(() => {
            dequeueCallCount++
            return new Promise<ConsumeJobRequest | null>((resolve, reject) => {
                pendingDequeues.push({ resolve, reject })
            })
        })

        dispatcher = createQueueDispatcher({
            queueName: 'test-queue',
            worker: mockWorker,
            dequeue: dequeueMock,
            log: mockLog,
        })
    })

    afterEach(() => {
        dispatcher.close()
        vi.useRealTimers()
    })

    it('should resolve a poll with the job it dequeues', async () => {
        const pollPromise = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)
        expect(pendingDequeues).toHaveLength(1)

        const job = createFakeJob('job-1')
        pendingDequeues[0].resolve(job)

        expect(await pollPromise).toEqual(job)
    })

    it('should fetch one job per waiting worker, concurrently', async () => {
        void dispatcher.poll()
        void dispatcher.poll()
        void dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)

        // Each poll fetches its own job — three concurrent getNextJob calls
        expect(dequeueCallCount).toBe(3)
        expect(pendingDequeues).toHaveLength(3)
    })

    it('should run a getNextJob for every one of 500 waiting workers (full-saturation)', async () => {
        for (let i = 0; i < 500; i++) {
            void dispatcher.poll()
        }

        await vi.advanceTimersByTimeAsync(0)

        expect(dequeueCallCount).toBe(500)
        expect(pendingDequeues).toHaveLength(500)
    })

    it('should return null when the poll deadline passes with an empty queue', async () => {
        // Empty queue: getNextJob blocks (drainDelay) then returns null, repeatedly.
        dequeueMock.mockImplementation(() => {
            dequeueCallCount++
            return new Promise<ConsumeJobRequest | null>((resolve) => {
                setTimeout(() => resolve(null), 15_000)
            })
        })

        const pollPromise = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(WAITER_TIMEOUT_MS + 15_000)

        expect(await pollPromise).toBeNull()
        expect(dequeueCallCount).toBeGreaterThan(1)
    })

    it('should retry after a delay when dequeue errors, then return the job', async () => {
        let call = 0
        const job = createFakeJob('job-after-error')
        dequeueMock.mockImplementation(() => {
            call++
            dequeueCallCount++
            return call === 1
                ? Promise.reject(new Error('Redis connection lost'))
                : Promise.resolve(job)
        })

        const pollPromise = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)
        // First call failed; waiting out the retry delay, no retry yet
        expect(dequeueCallCount).toBe(1)

        await vi.advanceTimersByTimeAsync(ERROR_RETRY_DELAY_MS)

        expect(await pollPromise).toEqual(job)
        expect(dequeueCallCount).toBe(2)
    })

    it('should report the number of in-flight polls as the waiter count', async () => {
        expect(dispatcher.waiterCount()).toBe(0)

        void dispatcher.poll()
        void dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)
        expect(dispatcher.waiterCount()).toBe(2)
    })

    it('should stop polling and return null after close()', async () => {
        const pollPromise = dispatcher.poll()
        await vi.advanceTimersByTimeAsync(0)

        dispatcher.close()
        // The in-flight dequeue settles (empty); the loop then sees closed and exits.
        pendingDequeues[0].resolve(null)

        expect(await pollPromise).toBeNull()
    })
})
