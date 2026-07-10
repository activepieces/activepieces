import { ExecutionType, LATEST_JOB_DATA_SCHEMA_VERSION, RunEnvironment, StreamStepProgress, WorkerJobType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fakeQueues = new Map<string, FakeQueue>()

class FakeQueue {
    name: string
    add = vi.fn()
    upsertJobScheduler = vi.fn()
    removeJobScheduler = vi.fn()
    removeGlobalConcurrency = vi.fn().mockResolvedValue(undefined)
    waitUntilReady = vi.fn().mockResolvedValue(undefined)
    close = vi.fn().mockResolvedValue(undefined)
    getJob = vi.fn().mockResolvedValue(null)
    getJobs = vi.fn().mockResolvedValue([])

    constructor(name: string) {
        this.name = name
        fakeQueues.set(name, this)
    }
}

vi.mock('bullmq', () => ({
    Queue: class {
        constructor(name: string) {
            // eslint-disable-next-line no-constructor-return
            return new FakeQueue(name)
        }
    },
    Job: class {},
}))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    redisConnections: {
        create: vi.fn().mockResolvedValue({}),
        useExisting: vi.fn().mockResolvedValue({}),
    },
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: vi.fn().mockReturnValue(undefined),
        getBoolean: vi.fn().mockReturnValue(undefined),
        getNumberOrThrow: vi.fn().mockReturnValue(30),
        getOrThrow: vi.fn().mockReturnValue('test'),
    },
}))

const mockIsWorkerGroupsEnabled = vi.fn()
const mockGetWorkerGroupId = vi.fn()
vi.mock('../../../../../src/app/ee/platform/platform-plan/worker-group.service', () => ({
    workerGroupService: () => ({
        isWorkerGroupsEnabled: mockIsWorkerGroupsEnabled,
        getWorkerGroupId: mockGetWorkerGroupId,
    }),
}))

const mockGetProjectWorkerGroup = vi.fn()
vi.mock('../../../../../src/app/project/project-worker-group.service', () => ({
    projectWorkerGroupService: () => ({
        getProjectWorkerGroup: mockGetProjectWorkerGroup,
    }),
}))

const mockCapacityGet = vi.fn()
vi.mock('../../../../../src/app/workers/machine/worker-capacity', () => ({
    workerCapacity: {
        get: () => mockCapacityGet(),
    },
}))

import { QueueName } from '../../../../../src/app/workers/job'
import { jobQueue, JobType } from '../../../../../src/app/workers/job-queue/job-queue'

const mockLog = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
} as never

function executeFlowJobData({ workerHandlerId }: { workerHandlerId?: string } = {}) {
    return {
        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
        jobType: WorkerJobType.EXECUTE_FLOW as const,
        executionType: ExecutionType.BEGIN as const,
        environment: RunEnvironment.PRODUCTION,
        platformId: 'platform-1',
        projectId: 'project-1',
        flowId: 'flow-1',
        flowVersionId: 'flow-version-1',
        runId: 'run-1',
        workerHandlerId: workerHandlerId ?? null,
        payload: { type: 'inline' as const, value: null },
        streamStepProgress: StreamStepProgress.NONE,
        logsFileId: 'logs-1',
        executeTrigger: false,
    }
}

function capacity({ syncOnline = 0, projectGroups = new Map<string, { slots: number, online: number }>() } = {}) {
    return {
        projectGroups,
        shared: { slots: 10, online: 5 },
        sync: { slots: syncOnline, online: syncOnline },
    }
}

// jobQueue caches Queue instances in a module-level map, so fake queues survive across
// tests; assertions count calls instead of expecting queue creation per test.
function addCallsTo(queueName: string): number {
    return fakeQueues.get(queueName)?.add.mock.calls.length ?? 0
}

describe('jobQueue sync routing', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        for (const queue of fakeQueues.values()) {
            queue.getJobs.mockReset()
            queue.getJobs.mockResolvedValue([])
        }
        mockIsWorkerGroupsEnabled.mockResolvedValue(false)
        mockGetWorkerGroupId.mockResolvedValue(null)
        mockGetProjectWorkerGroup.mockResolvedValue(null)
        mockCapacityGet.mockResolvedValue(capacity())
    })

    it('routes a sync run to syncJobs while a sync worker is online', async () => {
        mockCapacityGet.mockResolvedValue(capacity({ syncOnline: 2 }))

        await jobQueue(mockLog).add({
            id: 'run-1',
            type: JobType.ONE_TIME,
            data: executeFlowJobData({ workerHandlerId: 'server-1' }),
            syncRun: true,
        })

        expect(addCallsTo(QueueName.SYNC_JOBS)).toBe(1)
        expect(addCallsTo(QueueName.WORKER_JOBS)).toBe(0)
    })

    it('falls through to workerJobs when no sync worker is online', async () => {
        mockCapacityGet.mockResolvedValue(capacity({ syncOnline: 0 }))

        await jobQueue(mockLog).add({
            id: 'run-1',
            type: JobType.ONE_TIME,
            data: executeFlowJobData({ workerHandlerId: 'server-1' }),
            syncRun: true,
        })

        expect(addCallsTo(QueueName.WORKER_JOBS)).toBe(1)
        expect(addCallsTo(QueueName.SYNC_JOBS)).toBe(0)
    })

    it('keeps non-sync runs in workerJobs even when sync workers are online', async () => {
        mockCapacityGet.mockResolvedValue(capacity({ syncOnline: 2 }))

        await jobQueue(mockLog).add({
            id: 'run-1',
            type: JobType.ONE_TIME,
            data: executeFlowJobData(),
        })

        expect(addCallsTo(QueueName.WORKER_JOBS)).toBe(1)
        expect(addCallsTo(QueueName.SYNC_JOBS)).toBe(0)
    })

    it('lets the platform group queue win over sync routing', async () => {
        mockGetWorkerGroupId.mockResolvedValue('plat-group')
        mockCapacityGet.mockResolvedValue(capacity({ syncOnline: 2 }))

        await jobQueue(mockLog).add({
            id: 'run-1',
            type: JobType.ONE_TIME,
            data: executeFlowJobData({ workerHandlerId: 'server-1' }),
            syncRun: true,
        })

        expect(addCallsTo('platform-plat-group-jobs')).toBe(1)
        expect(addCallsTo(QueueName.SYNC_JOBS)).toBe(0)
    })

    it('lets a live project group queue win over sync routing', async () => {
        mockIsWorkerGroupsEnabled.mockResolvedValue(true)
        mockGetProjectWorkerGroup.mockResolvedValue('pool-a')
        mockCapacityGet.mockResolvedValue(capacity({
            syncOnline: 2,
            projectGroups: new Map([['pool-a', { slots: 1, online: 1 }]]),
        }))

        await jobQueue(mockLog).add({
            id: 'run-1',
            type: JobType.ONE_TIME,
            data: executeFlowJobData({ workerHandlerId: 'server-1' }),
            syncRun: true,
        })

        expect(addCallsTo('project-pool-a-jobs')).toBe(1)
        expect(addCallsTo(QueueName.SYNC_JOBS)).toBe(0)
    })

    it('removeAllFlowRunJobs scans both the routed queue and syncJobs', async () => {
        const removedFromShared = { id: 'run-1', remove: vi.fn() }
        const keptInShared = { id: 'other-run', remove: vi.fn() }
        const removedFromSync = { id: 'run-1-resume-wp1', remove: vi.fn() }

        // First call materializes both queues in jobQueue's module-level map
        await jobQueue(mockLog).removeAllFlowRunJobs({
            flowRunId: 'run-1',
            platformId: 'platform-1',
            projectId: 'project-1',
        })
        fakeQueues.get(QueueName.WORKER_JOBS)!.getJobs.mockResolvedValue([removedFromShared, keptInShared])
        fakeQueues.get(QueueName.SYNC_JOBS)!.getJobs.mockResolvedValue([removedFromSync])

        await jobQueue(mockLog).removeAllFlowRunJobs({
            flowRunId: 'run-1',
            platformId: 'platform-1',
            projectId: 'project-1',
        })

        expect(removedFromShared.remove).toHaveBeenCalled()
        expect(keptInShared.remove).not.toHaveBeenCalled()
        expect(removedFromSync.remove).toHaveBeenCalled()
    })
})
