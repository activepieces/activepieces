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
        timeoutInSeconds: 600,
        attempsStarted: 0,
        engineToken: 'token',
    }
}

describe('QueueDispatcher', () => {
    let dispatcher: QueueDispatcher
    let dequeueMock: ReturnType<typeof vi.fn>
    let onOrphanedJobMock: ReturnType<typeof vi.fn>
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

        onOrphanedJobMock = vi.fn().mockResolvedValue(undefined)

        dispatcher = createQueueDispatcher({
            queueName: 'test-queue',
            worker: mockWorker,
            dequeue: dequeueMock,
            onOrphanedJob: onOrphanedJobMock,
            log: mockLog,
        })
    })

    afterEach(() => {
        dispatcher.close()
        vi.useRealTimers()
    })

    it('should dispatch a job to the first waiter (FIFO)', async () => {
        const poll1 = dispatcher.poll()
        const poll2 = dispatcher.poll()

        // Allow microtasks so the loop starts and calls dequeue
        await vi.advanceTimersByTimeAsync(0)

        expect(pendingDequeues).toHaveLength(1)

        const job1 = createFakeJob('job-1')
        pendingDequeues[0].resolve(job1)

        // Allow microtasks for dispatch + next dequeue call
        await vi.advanceTimersByTimeAsync(0)

        const result1 = await poll1
        expect(result1).toEqual(job1)

        // Second dequeue should now be pending for the second waiter
        expect(pendingDequeues).toHaveLength(2)

        const job2 = createFakeJob('job-2')
        pendingDequeues[1].resolve(job2)
        await vi.advanceTimersByTimeAsync(0)

        const result2 = await poll2
        expect(result2).toEqual(job2)
    })

    it('should only have one active getNextJob call at a time', async () => {
        dispatcher.poll()
        dispatcher.poll()
        dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)

        // Only one dequeue call should be active despite 3 waiters
        expect(dequeueCallCount).toBe(1)
        expect(pendingDequeues).toHaveLength(1)
    })

    it('should return null when waiter times out', async () => {
        const pollPromise = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)

        // Dequeue is pending but no job arrives
        // Advance past the waiter timeout
        await vi.advanceTimersByTimeAsync(WAITER_TIMEOUT_MS + 100)

        const result = await pollPromise
        expect(result).toBeNull()
    })

    it('should retry on dequeue error after delay', async () => {
        const pollPromise = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)

        // First dequeue fails
        pendingDequeues[0].reject(new Error('Redis connection lost'))
        await vi.advanceTimersByTimeAsync(0)

        // Should not have retried yet (waiting for ERROR_RETRY_DELAY_MS)
        expect(dequeueCallCount).toBe(1)

        // Advance past the retry delay
        await vi.advanceTimersByTimeAsync(ERROR_RETRY_DELAY_MS)

        // Now it should have retried
        expect(dequeueCallCount).toBe(2)

        // Resolve the retry with a job
        const job = createFakeJob('job-after-error')
        pendingDequeues[1].resolve(job)
        await vi.advanceTimersByTimeAsync(0)

        const result = await pollPromise
        expect(result).toEqual(job)
    })

    it('should loop back and retry when dequeue returns null (empty queue after drainDelay)', async () => {
        const pollPromise = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)

        // First dequeue returns null (queue empty, drainDelay expired)
        pendingDequeues[0].resolve(null)
        await vi.advanceTimersByTimeAsync(0)

        // Should have called dequeue again
        expect(dequeueCallCount).toBe(2)

        // Second dequeue returns a job
        const job = createFakeJob('job-retry')
        pendingDequeues[1].resolve(job)
        await vi.advanceTimersByTimeAsync(0)

        const result = await pollPromise
        expect(result).toEqual(job)
    })

    it('should stop the loop when no waiters remain', async () => {
        const pollPromise = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)
        expect(dequeueCallCount).toBe(1)

        // Resolve with a job — this satisfies the only waiter
        const job = createFakeJob('job-1')
        pendingDequeues[0].resolve(job)
        await vi.advanceTimersByTimeAsync(0)

        await pollPromise

        // No more waiters, so no further dequeue calls
        // Wait a bit to confirm
        await vi.advanceTimersByTimeAsync(1000)
        expect(dequeueCallCount).toBe(1)
    })

    it('should restart the loop when a new poll arrives after loop stopped', async () => {
        // First poll
        const poll1 = dispatcher.poll()
        await vi.advanceTimersByTimeAsync(0)

        const job1 = createFakeJob('job-1')
        pendingDequeues[0].resolve(job1)
        await vi.advanceTimersByTimeAsync(0)
        await poll1

        // Loop has stopped. Start a new poll.
        const poll2 = dispatcher.poll()
        await vi.advanceTimersByTimeAsync(0)

        expect(dequeueCallCount).toBe(2)

        const job2 = createFakeJob('job-2')
        pendingDequeues[1].resolve(job2)
        await vi.advanceTimersByTimeAsync(0)

        const result = await poll2
        expect(result).toEqual(job2)
    })

    it('should close all pending waiters with null', async () => {
        const poll1 = dispatcher.poll()
        const poll2 = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)

        dispatcher.close()

        const [result1, result2] = await Promise.all([poll1, poll2])
        expect(result1).toBeNull()
        expect(result2).toBeNull()
    })

    it('should report waiter count', async () => {
        expect(dispatcher.waiterCount()).toBe(0)

        dispatcher.poll()
        dispatcher.poll()

        expect(dispatcher.waiterCount()).toBe(2)
    })

    it('should call onOrphanedJob when job is dequeued but all waiters timed out', async () => {
        const pollPromise = dispatcher.poll()

        await vi.advanceTimersByTimeAsync(0)
        expect(pendingDequeues).toHaveLength(1)

        // Waiter times out before dequeue returns
        await vi.advanceTimersByTimeAsync(WAITER_TIMEOUT_MS + 100)
        const result = await pollPromise
        expect(result).toBeNull()

        // Now dequeue returns a job — but no waiter is left
        const orphanedJob = createFakeJob('orphaned-job')
        pendingDequeues[0].resolve(orphanedJob)
        await vi.advanceTimersByTimeAsync(0)

        expect(onOrphanedJobMock).toHaveBeenCalledWith('orphaned-job', mockLog)
    })

    it('should not spawn a second concurrent loop after close() while dequeue is in-flight', async () => {
        const poll1 = dispatcher.poll()
        await vi.advanceTimersByTimeAsync(0)

        // Dequeue #1 is in-flight. Close the dispatcher.
        dispatcher.close()
        const result1 = await poll1
        expect(result1).toBeNull()

        // A new poll arrives while the in-flight dequeue hasn't resolved yet.
        // startLoop() sees loopRunning=true and does NOT spawn a second loop.
        const poll2 = dispatcher.poll()
        await vi.advanceTimersByTimeAsync(0)

        // Still only 1 dequeue call — no second concurrent call was made
        expect(dequeueCallCount).toBe(1)
        expect(pendingDequeues).toHaveLength(1)

        // The in-flight dequeue resolves — the existing loop finds the new waiter
        // and continues (single loop, no concurrency). It makes dequeue call #2.
        pendingDequeues[0].resolve(null)
        await vi.advanceTimersByTimeAsync(0)

        expect(dequeueCallCount).toBe(2)

        // Resolve dequeue #2 with a job for the second waiter
        const job = createFakeJob('job-after-close')
        pendingDequeues[1].resolve(job)
        await vi.advanceTimersByTimeAsync(0)

        const result2 = await poll2
        expect(result2).toEqual(job)
    })
})
