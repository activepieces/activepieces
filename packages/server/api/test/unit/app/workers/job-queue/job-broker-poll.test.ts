import { ConsumeJobRequest, ExecutionType, LATEST_JOB_DATA_SCHEMA_VERSION, RunEnvironment, StreamStepProgress, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDispatcherPoll = vi.fn()
const mockMoveToDelayed = vi.fn()

vi.mock('bullmq', async (importOriginal) => {
    const actual = await importOriginal<typeof import('bullmq')>()
    class FakeWorker {
        waitUntilReady = vi.fn().mockResolvedValue(undefined)
        startStalledCheckTimer = vi.fn().mockResolvedValue(undefined)
        on = vi.fn()
    }
    return {
        ...actual,
        Worker: FakeWorker,
        Job: {
            fromId: vi.fn(async (_worker: unknown, id: string) => ({
                id,
                data: executeFlowJobData,
                moveToDelayed: mockMoveToDelayed,
            })),
        },
    }
})

vi.mock('../../../../../src/app/database/redis-connections', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../src/app/database/redis-connections')>()
    return {
        ...actual,
        redisConnections: { ...actual.redisConnections, create: vi.fn().mockResolvedValue({}) },
    }
})

vi.mock('../../../../../src/app/workers/job-queue/queue-dispatcher', () => ({
    WAITER_TIMEOUT_MS: 50_000,
    createQueueDispatcher: () => ({ poll: mockDispatcherPoll, close: vi.fn() }),
}))

vi.mock('../../../../../src/app/workers/job-queue/interceptors/rate-limiter-interceptor', () => ({
    rateLimiterInterceptor: { preDispatch: vi.fn(), onJobFinished: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../../../../src/app/workers/job-queue/interceptors/zombie-polling-interceptor', () => ({
    zombiePollingInterceptor: { preDispatch: vi.fn(), onJobFinished: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../../../../src/app/workers/job-queue/interceptors/polling-exclusivity-interceptor', () => ({
    pollingExclusivityInterceptor: { preDispatch: vi.fn(), onJobFinished: vi.fn().mockResolvedValue(undefined) },
}))

const executeFlowJobData = {
    projectId: 'proj-1',
    platformId: 'plat-1',
    jobType: WorkerJobType.EXECUTE_FLOW,
    executionType: ExecutionType.BEGIN,
    environment: RunEnvironment.PRODUCTION,
    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
    flowId: 'flow-1',
    flowVersionId: 'flow-version-1',
    runId: 'run-1',
    payload: { type: 'inline' as const, value: null },
    streamStepProgress: StreamStepProgress.NONE,
    logsFileId: 'logs-1',
}

import { jobAssignmentTracker } from '../../../../../src/app/workers/job-queue/job-assignment-tracker'
import { jobBroker } from '../../../../../src/app/workers/job-queue/job-broker'
import { workerShutdownTracker } from '../../../../../src/app/workers/job-queue/worker-shutdown-tracker'

const log = {
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

const QUEUE = 'workerJobs'

function buildJob(id: string): ConsumeJobRequest {
    return {
        jobId: id,
        jobData: executeFlowJobData,
        timeoutInSeconds: 600,
        attempsStarted: 0,
        engineToken: 'engine-token',
        token: `token-${id}`,
        queueName: QUEUE,
    }
}

describe('jobBroker.poll for a worker that is shutting down', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        workerShutdownTracker.reset()
        jobAssignmentTracker.reset()
    })

    it('records and delivers a job to a worker that is not shutting down', async () => {
        mockDispatcherPoll.mockResolvedValueOnce(buildJob('job-1'))

        const delivered = await jobBroker(log).poll(QUEUE, { id: 'socket-1', connected: true })

        expect(delivered?.jobId).toBe('job-1')
        expect(jobAssignmentTracker.takeByConnection('socket-1')).toEqual([{ jobId: 'job-1', token: 'token-job-1', queueName: QUEUE }])
        expect(mockMoveToDelayed).not.toHaveBeenCalled()
    })

    it('does not poll the queue for a worker already marked as shutting down', async () => {
        jobBroker(log).markWorkerShuttingDown('socket-1')

        const delivered = await jobBroker(log).poll(QUEUE, { id: 'socket-1', connected: true })

        expect(delivered).toBeNull()
        expect(mockDispatcherPoll).not.toHaveBeenCalled()
    })

    it('returns a job to the queue when the worker starts shutting down while its poll waits', async () => {
        mockDispatcherPoll.mockImplementationOnce(async () => {
            jobBroker(log).markWorkerShuttingDown('socket-1')
            return buildJob('job-2')
        })

        const delivered = await jobBroker(log).poll(QUEUE, { id: 'socket-1', connected: true })

        expect(delivered).toBeNull()
        expect(mockMoveToDelayed).toHaveBeenCalledWith(expect.any(Number), 'token-job-2')
        expect(jobAssignmentTracker.takeByConnection('socket-1')).toEqual([])
    })
})
