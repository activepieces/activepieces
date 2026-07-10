import { MachineInformation, WorkerGroupScope } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let inMemoryWorkers: WorkerMachine[] = []

vi.mock('../../../../../src/app/workers/machine/machine-cache', () => ({
    workerMachineCache: () => ({
        async find(): Promise<WorkerMachine[]> {
            return inMemoryWorkers
        },
    }),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: vi.fn().mockReturnValue(undefined),
        getBoolean: vi.fn().mockReturnValue(undefined),
        getNumberOrThrow: vi.fn().mockReturnValue(30),
        getOrThrow: vi.fn().mockReturnValue('test'),
    },
}))

vi.mock('../../../../../src/app/helper/pubsub', () => ({
    pubsub: {
        subscribe: vi.fn().mockResolvedValue(undefined),
        publish: vi.fn().mockResolvedValue(undefined),
    },
}))

const mockGetCurrentRelease = vi.fn().mockReturnValue('1.0.0')
vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...actual,
        apVersionUtil: {
            ...actual.apVersionUtil,
            getCurrentRelease: () => mockGetCurrentRelease(),
        },
    }
})

import { WorkerMachine } from '../../../../../src/app/workers/machine/machine-cache'
import { workerCapacity } from '../../../../../src/app/workers/machine/worker-capacity'
import { QueueName } from '../../../../../src/app/workers/job'

function fakeWorker({ id, concurrency, workerGroupId, workerGroupScope, workerQueue, version }: {
    id: string
    concurrency: number
    workerGroupId?: string
    workerGroupScope?: WorkerGroupScope
    workerQueue?: QueueName.SYNC_JOBS
    version?: string
}): WorkerMachine {
    const now = new Date().toISOString()
    return {
        id,
        created: now,
        updated: now,
        workerGroupId,
        workerGroupScope,
        workerQueue,
        information: {
            workerId: id,
            workerProps: { WORKER_CONCURRENCY: String(concurrency), version: version ?? '1.0.0' },
        } as unknown as MachineInformation,
    }
}

describe('workerCapacity sync pool', () => {
    beforeEach(async () => {
        inMemoryWorkers = []
        mockGetCurrentRelease.mockReturnValue('1.0.0')
        await workerCapacity.invalidate()
    })

    it('counts sync workers in the sync pool, not the shared pool', async () => {
        inMemoryWorkers = [
            fakeWorker({ id: 'shared-1', concurrency: 4 }),
            fakeWorker({ id: 'sync-1', concurrency: 2, workerQueue: QueueName.SYNC_JOBS }),
            fakeWorker({ id: 'sync-2', concurrency: 3, workerQueue: QueueName.SYNC_JOBS }),
        ]

        const snapshot = await workerCapacity.get()

        expect(snapshot.sync).toEqual({ slots: 5, online: 2 })
        expect(snapshot.shared).toEqual({ slots: 4, online: 1 })
    })

    it('reports an empty sync pool when no sync worker is connected', async () => {
        inMemoryWorkers = [fakeWorker({ id: 'shared-1', concurrency: 4 })]

        const snapshot = await workerCapacity.get()

        expect(snapshot.sync).toEqual({ slots: 0, online: 0 })
    })

    it('excludes a version-mismatched sync worker from the sync pool', async () => {
        mockGetCurrentRelease.mockReturnValue('2.0.0')
        inMemoryWorkers = [
            fakeWorker({ id: 'sync-old', concurrency: 3, workerQueue: QueueName.SYNC_JOBS, version: '1.0.0' }),
            fakeWorker({ id: 'sync-new', concurrency: 2, workerQueue: QueueName.SYNC_JOBS, version: '2.0.0' }),
        ]

        const snapshot = await workerCapacity.get()

        expect(snapshot.sync).toEqual({ slots: 2, online: 1 })
    })

    it('keeps project group workers out of both shared and sync pools', async () => {
        inMemoryWorkers = [
            fakeWorker({ id: 'grouped-1', concurrency: 2, workerGroupId: 'pool-a', workerGroupScope: WorkerGroupScope.PROJECT }),
            fakeWorker({ id: 'sync-1', concurrency: 1, workerQueue: QueueName.SYNC_JOBS }),
        ]

        const snapshot = await workerCapacity.get()

        expect(snapshot.projectGroups.get('pool-a')).toEqual({ slots: 2, online: 1 })
        expect(snapshot.shared).toEqual({ slots: 0, online: 0 })
        expect(snapshot.sync).toEqual({ slots: 1, online: 1 })
    })
})
