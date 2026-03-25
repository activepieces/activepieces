import { InterceptorVerdict } from '../../../../../src/app/workers/job-queue/job-interceptor'
import { Job, Worker as BullMQWorker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { tryDequeue } from '../../../../../src/app/workers/job-queue/job-broker'

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
    } as unknown as Job
}

describe('tryDequeue', () => {
    let mockWorker: BullMQWorker

    beforeEach(() => {
        vi.clearAllMocks()
        mockWorker = {
            getNextJob: vi.fn(),
        } as unknown as BullMQWorker
    })

    it('should return job when interceptor allows', async () => {
        const job = createMockJob('job-1')
        vi.mocked(mockWorker.getNextJob).mockResolvedValueOnce(job)
        mockPreDispatch.mockResolvedValueOnce({ verdict: InterceptorVerdict.ALLOW })

        const result = await tryDequeue(mockWorker, 'test-queue', mockLog)

        expect(result).not.toBeNull()
        expect(result!.jobId).toBe('job-1')
        expect(result!.engineToken).toBe('engine-token')
        expect(result!.timeoutInSeconds).toBe(600)
        expect(result!.token).toMatch(/^token-/)
        expect(result!.queueName).toBe('test-queue')
        expect(job.updateData).not.toHaveBeenCalled()
        expect(mockWorker.getNextJob).toHaveBeenCalledTimes(1)
    })

    it('should retry when interceptor rejects then return next allowed job', async () => {
        const jobA = createMockJob('job-a')
        const jobB = createMockJob('job-b')

        vi.mocked(mockWorker.getNextJob)
            .mockResolvedValueOnce(jobA)
            .mockResolvedValueOnce(jobB)

        mockPreDispatch
            .mockResolvedValueOnce({ verdict: InterceptorVerdict.REJECT, delayInMs: 5000 })
            .mockResolvedValueOnce({ verdict: InterceptorVerdict.ALLOW })

        const result = await tryDequeue(mockWorker, 'test-queue', mockLog)

        expect(result).not.toBeNull()
        expect(result!.jobId).toBe('job-b')
        expect(mockWorker.getNextJob).toHaveBeenCalledTimes(2)
        expect(jobA.moveToDelayed).toHaveBeenCalledTimes(1)
        expect(jobB.moveToDelayed).not.toHaveBeenCalled()
    })

    it('should return null when no jobs remain after rejection', async () => {
        const job = createMockJob('job-1')

        vi.mocked(mockWorker.getNextJob)
            .mockResolvedValueOnce(job)
            .mockResolvedValueOnce(undefined as unknown as Job)

        mockPreDispatch
            .mockResolvedValueOnce({ verdict: InterceptorVerdict.REJECT, delayInMs: 5000 })

        const result = await tryDequeue(mockWorker, 'test-queue', mockLog)

        expect(result).toBeNull()
        expect(mockWorker.getNextJob).toHaveBeenCalledTimes(2)
        expect(job.moveToDelayed).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple consecutive rejections then return null', async () => {
        const jobs = [createMockJob('j1'), createMockJob('j2'), createMockJob('j3')]

        const getNextJobMock = vi.mocked(mockWorker.getNextJob)
        for (const j of jobs) {
            getNextJobMock.mockResolvedValueOnce(j)
        }
        getNextJobMock.mockResolvedValueOnce(undefined as unknown as Job)

        mockPreDispatch
            .mockResolvedValue({ verdict: InterceptorVerdict.REJECT, delayInMs: 5000 })

        const result = await tryDequeue(mockWorker, 'test-queue', mockLog)

        expect(result).toBeNull()
        expect(mockWorker.getNextJob).toHaveBeenCalledTimes(4)
        for (const j of jobs) {
            expect(j.moveToDelayed).toHaveBeenCalledTimes(1)
        }
    })

    it('should set priority on delayed job when interceptor specifies it', async () => {
        const jobA = createMockJob('job-a')
        const jobB = createMockJob('job-b')

        vi.mocked(mockWorker.getNextJob)
            .mockResolvedValueOnce(jobA)
            .mockResolvedValueOnce(jobB)

        mockPreDispatch
            .mockResolvedValueOnce({ verdict: InterceptorVerdict.REJECT, delayInMs: 3000, priority: 10 })
            .mockResolvedValueOnce({ verdict: InterceptorVerdict.ALLOW })

        const result = await tryDequeue(mockWorker, 'test-queue', mockLog)

        expect(result!.jobId).toBe('job-b')
        expect(jobA.changePriority).toHaveBeenCalledWith({ priority: 10 })
    })

    it('should return null when queue is empty (no jobs at all)', async () => {
        vi.mocked(mockWorker.getNextJob).mockResolvedValueOnce(undefined as unknown as Job)

        const result = await tryDequeue(mockWorker, 'test-queue', mockLog)

        expect(result).toBeNull()
        expect(mockWorker.getNextJob).toHaveBeenCalledTimes(1)
    })
})
