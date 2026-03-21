import { ConsumeJobResponseStatus, ExecutionType } from '@activepieces/shared'
import { DelayedError, Job, Worker as BullMQWorker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InterceptorVerdict } from '../../../../../src/app/workers/job-queue/job-interceptor'

const mockGenerateEngineToken = vi.fn().mockResolvedValue('engine-token')

vi.mock('../../../../../src/app/authentication/lib/access-token-manager', () => ({
    accessTokenManager: () => ({
        generateEngineToken: mockGenerateEngineToken,
    }),
}))

vi.mock('../../../../../src/app/workers/migrations/job-data-migrations', () => ({
    jobMigrations: () => ({
        apply: vi.fn((data: unknown) => Promise.resolve(data)),
    }),
}))

const mockPreDispatch = vi.fn()
const mockOnJobFinished = vi.fn().mockResolvedValue(undefined)

vi.mock('../../../../../src/app/workers/job-queue/interceptors/rate-limiter-interceptor', () => ({
    rateLimiterInterceptor: {
        preDispatch: (...args: unknown[]) => mockPreDispatch(...args),
        onJobFinished: (...args: unknown[]) => mockOnJobFinished(...args),
    },
}))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    redisConnections: {
        create: vi.fn().mockResolvedValue({}),
    },
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        getBoolean: vi.fn().mockReturnValue(false),
    },
}))

// Capture the processor callback passed to BullMQ Worker constructor
let capturedProcessor: ((job: Job, token?: string) => Promise<unknown>) | undefined
let capturedOptions: Record<string, unknown> | undefined
const mockWorkerInstance = {
    waitUntilReady: vi.fn().mockResolvedValue(undefined),
    startStalledCheckTimer: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
}

vi.mock('bullmq', async (importOriginal) => {
    const actual = await importOriginal<typeof import('bullmq')>()
    return {
        ...actual,
        Worker: vi.fn().mockImplementation((_name: string, processor: unknown, opts: unknown) => {
            capturedProcessor = processor as typeof capturedProcessor
            capturedOptions = opts as typeof capturedOptions
            return mockWorkerInstance
        }),
    }
})

vi.mock('bullmq-otel', () => ({
    BullMQOtel: vi.fn(),
}))

import { jobBroker } from '../../../../../src/app/workers/job-queue/job-broker'

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

function createMockJob(id: string, data?: Record<string, unknown>): Job {
    return {
        id,
        name: `job-name-${id}`,
        data: { projectId: 'proj-1', platformId: 'plat-1', ...data },
        attemptsMade: 0,
        moveToDelayed: vi.fn().mockResolvedValue(undefined),
        changePriority: vi.fn().mockResolvedValue(undefined),
        updateData: vi.fn().mockResolvedValue(undefined),
        extendLock: vi.fn().mockResolvedValue(undefined),
    } as unknown as Job
}

describe('jobBroker', () => {
    const broker = jobBroker(mockLog)

    beforeEach(async () => {
        vi.clearAllMocks()
        capturedProcessor = undefined
        await broker.init()
    })

    afterEach(async () => {
        await broker.close()
    })

    describe('processor — interceptor rejection', () => {
        it('should throw DelayedError and move job to delayed when interceptor rejects', async () => {
            const job = createMockJob('job-1')
            mockPreDispatch.mockResolvedValueOnce({ verdict: InterceptorVerdict.REJECT, delayInMs: 5000 })

            await expect(capturedProcessor!(job, 'token-1')).rejects.toThrow(DelayedError)

            expect(job.moveToDelayed).toHaveBeenCalledTimes(1)
            expect(job.moveToDelayed).toHaveBeenCalledWith(expect.any(Number), 'token-1')
        })

        it('should set priority on delayed job when interceptor specifies it', async () => {
            const job = createMockJob('job-1')
            mockPreDispatch.mockResolvedValueOnce({ verdict: InterceptorVerdict.REJECT, delayInMs: 3000, priority: 10 })

            await expect(capturedProcessor!(job, 'token-1')).rejects.toThrow(DelayedError)

            expect(job.changePriority).toHaveBeenCalledWith({ priority: 10 })
        })
    })

    describe('processor — no waiter available', () => {
        it('should throw DelayedError and return job to queue when no waiters', async () => {
            const job = createMockJob('job-1')
            mockPreDispatch.mockResolvedValueOnce({ verdict: InterceptorVerdict.ALLOW })

            // No poll() called, so no waiters exist
            await expect(capturedProcessor!(job, 'token-1')).rejects.toThrow(DelayedError)

            expect(job.moveToDelayed).toHaveBeenCalledWith(expect.any(Number), 'token-1')
        })
    })

    describe('processor — waiter handoff', () => {
        it('should hand off job data and engine token to waiter, then complete on completeJob', async () => {
            mockPreDispatch.mockResolvedValueOnce({ verdict: InterceptorVerdict.ALLOW })

            const job = createMockJob('job-1')
            const pollPromise = broker.poll()

            // Run the processor in parallel — it will hand off to the waiter then block
            const processorPromise = capturedProcessor!(job, 'token-1')

            // Wait for microtasks so the waiter gets resolved
            await new Promise(r => setTimeout(r, 10))

            const pollResult = await pollPromise
            expect(pollResult).not.toBeNull()
            expect(pollResult!.jobId).toBe('job-1')
            expect(pollResult!.engineToken).toBe('engine-token')
            expect(pollResult!.timeoutInSeconds).toBe(600)

            // Complete the job
            await broker.completeJob({
                jobId: 'job-1',
                status: ConsumeJobResponseStatus.OK,
            })

            const result = await processorPromise
            expect(result).toEqual({ response: undefined })
        })

        it('should handle delayed completion (resume)', async () => {
            mockPreDispatch.mockResolvedValueOnce({ verdict: InterceptorVerdict.ALLOW })

            const job = createMockJob('job-1')
            const pollPromise = broker.poll()
            const processorPromise = capturedProcessor!(job, 'token-1')

            await new Promise(r => setTimeout(r, 10))
            await pollPromise

            await broker.completeJob({
                jobId: 'job-1',
                status: ConsumeJobResponseStatus.OK,
                delayInSeconds: 30,
            })

            await expect(processorPromise).rejects.toThrow(DelayedError)
            expect(job.updateData).toHaveBeenCalledWith(expect.objectContaining({
                executionType: ExecutionType.RESUME,
            }))
            expect(job.moveToDelayed).toHaveBeenCalled()
        })

        it('should throw error on internal error completion', async () => {
            mockPreDispatch.mockResolvedValueOnce({ verdict: InterceptorVerdict.ALLOW })

            const job = createMockJob('job-1')
            const pollPromise = broker.poll()
            const processorPromise = capturedProcessor!(job, 'token-1')

            await new Promise(r => setTimeout(r, 10))
            await pollPromise

            await broker.completeJob({
                jobId: 'job-1',
                status: ConsumeJobResponseStatus.INTERNAL_ERROR,
                errorMessage: 'Something went wrong',
            })

            await expect(processorPromise).rejects.toThrow('Something went wrong')
        })
    })

    describe('completeJob — unknown job', () => {
        it('should warn and return when completing an unknown job', async () => {
            await broker.completeJob({
                jobId: 'unknown-job',
                status: ConsumeJobResponseStatus.OK,
            })

            expect(mockLog.warn).toHaveBeenCalledWith(
                { jobId: 'unknown-job' },
                '[jobBroker] completeJob called for unknown job',
            )
        })
    })

    describe('extendLock', () => {
        it('should extend lock on active job', async () => {
            mockPreDispatch.mockResolvedValueOnce({ verdict: InterceptorVerdict.ALLOW })

            const job = createMockJob('job-1')
            const pollPromise = broker.poll()
            capturedProcessor!(job, 'token-1')

            await new Promise(r => setTimeout(r, 10))
            await pollPromise

            await broker.extendLock({ jobId: 'job-1' })

            expect(job.extendLock).toHaveBeenCalledWith('token-1', 120_000)
        })

        it('should warn when extending lock on unknown job', async () => {
            await broker.extendLock({ jobId: 'unknown-job' })

            expect(mockLog.warn).toHaveBeenCalledWith(
                { jobId: 'unknown-job' },
                '[jobBroker] extendLock called for unknown job',
            )
        })
    })

    describe('close', () => {
        it('should resolve pending waiters with null on close', async () => {
            const pollPromise = broker.poll()

            await broker.close()

            const result = await pollPromise
            expect(result).toBeNull()
        })
    })

    describe('worker config', () => {
        it('should use concurrency 10', () => {
            expect(capturedOptions?.concurrency).toBe(10)
        })

        it('should use drainDelay 15', () => {
            expect(capturedOptions?.drainDelay).toBe(15)
        })

        it('should use autorun true', () => {
            expect(capturedOptions?.autorun).toBe(true)
        })
    })
})
