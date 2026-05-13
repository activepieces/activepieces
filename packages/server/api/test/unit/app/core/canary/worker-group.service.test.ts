import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFind = vi.fn()
const mockFindOne = vi.fn()
const mockUpdate = vi.fn()

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanRepo: () => ({
        find: mockFind,
        findOne: mockFindOne,
        update: mockUpdate,
    }),
}))

const mockDistributedStoreGet = vi.fn()
const mockDistributedStorePut = vi.fn()
const mockDistributedStoreDelete = vi.fn()

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedStore: {
        get: (...args: unknown[]) => mockDistributedStoreGet(...args),
        put: (...args: unknown[]) => mockDistributedStorePut(...args),
        delete: (...args: unknown[]) => mockDistributedStoreDelete(...args),
    },
}))

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

type WorkerGroupService = ReturnType<typeof import('../../../../../src/app/ee/platform/platform-plan/worker-group.service').workerGroupService>

async function loadService(): Promise<WorkerGroupService> {
    const mod = await import('../../../../../src/app/ee/platform/platform-plan/worker-group.service')
    return mod.workerGroupService(mockLog)
}

describe('workerGroupService', () => {
    let service: WorkerGroupService

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()
        service = await loadService()
    })

    describe('getWorkerGroupId', () => {
        it('returns groupId from DB when not cached', async () => {
            mockDistributedStoreGet.mockResolvedValue(null)
            mockFindOne.mockResolvedValue({ workerGroupId: 'canary' })

            const result = await service.getWorkerGroupId({ platformId: 'p1' })

            expect(result).toBe('canary')
            expect(mockDistributedStorePut).toHaveBeenCalledWith('platform:p1:worker_group_id', 'canary', expect.any(Number))
        })

        it('returns null and caches sentinel when platform has no worker group', async () => {
            mockDistributedStoreGet.mockResolvedValue(null)
            mockFindOne.mockResolvedValue({ workerGroupId: null })

            const result = await service.getWorkerGroupId({ platformId: 'p2' })

            expect(result).toBeNull()
            expect(mockDistributedStorePut).toHaveBeenCalledWith('platform:p2:worker_group_id', '__none__', expect.any(Number))
        })

        it('returns null without hitting DB when sentinel is cached', async () => {
            mockDistributedStoreGet.mockResolvedValue('__none__')

            const result = await service.getWorkerGroupId({ platformId: 'p3' })

            expect(result).toBeNull()
            expect(mockFindOne).not.toHaveBeenCalled()
        })

        it('returns cached value without hitting DB', async () => {
            mockDistributedStoreGet.mockResolvedValue('my-group')

            const result = await service.getWorkerGroupId({ platformId: 'p1' })

            expect(result).toBe('my-group')
            expect(mockFindOne).not.toHaveBeenCalled()
        })
    })

    describe('isCanaryPlatform', () => {
        it('returns true for canary platform', async () => {
            mockFind.mockResolvedValue([{ platformId: 'p1' }])

            const result = await service.isCanaryPlatform({ platformId: 'p1' })

            expect(result).toBe(true)
        })

        it('returns false for non-canary platform', async () => {
            mockFind.mockResolvedValue([{ platformId: 'p1' }])

            const result = await service.isCanaryPlatform({ platformId: 'p2' })

            expect(result).toBe(false)
        })

        it('caches after first call', async () => {
            mockFind.mockResolvedValue([{ platformId: 'p1' }])

            await service.isCanaryPlatform({ platformId: 'p1' })
            await service.isCanaryPlatform({ platformId: 'p1' })

            expect(mockFind).toHaveBeenCalledTimes(1)
        })

        it('concurrent calls only hit DB once', async () => {
            let resolveFind!: (value: { platformId: string }[]) => void
            mockFind.mockReturnValue(new Promise((resolve) => {
                resolveFind = resolve
            }))

            const promises = Array.from({ length: 10 }, () =>
                service.isCanaryPlatform({ platformId: 'p1' }),
            )

            await new Promise((r) => setTimeout(r, 50))
            resolveFind([{ platformId: 'p1' }])

            const results = await Promise.all(promises)

            expect(mockFind).toHaveBeenCalledTimes(1)
            expect(results.every((r) => r === true)).toBe(true)
        })
    })

    describe('updateWorkerGroup', () => {
        it('invalidates cache', async () => {
            mockFind.mockResolvedValue([{ platformId: 'p1' }])
            mockUpdate.mockResolvedValue(undefined)
            mockDistributedStoreGet.mockResolvedValue(null)
            mockDistributedStoreDelete.mockResolvedValue(undefined)

            await service.isCanaryPlatform({ platformId: 'p1' })
            expect(mockFind).toHaveBeenCalledTimes(1)

            await service.updateWorkerGroup({ platformId: 'p1', workerGroupId: null })

            mockFind.mockResolvedValue([])
            await service.isCanaryPlatform({ platformId: 'p1' })
            expect(mockFind).toHaveBeenCalledTimes(2)
        })
    })

    describe('disableAllCanary', () => {
        it('invalidates cache', async () => {
            mockFind.mockResolvedValue([{ platformId: 'p1' }])
            mockUpdate.mockResolvedValue(undefined)
            mockDistributedStoreDelete.mockResolvedValue(undefined)

            await service.isCanaryPlatform({ platformId: 'p1' })
            expect(mockFind).toHaveBeenCalledTimes(1)

            await service.disableAllCanary()

            mockFind.mockResolvedValue([])
            await service.isCanaryPlatform({ platformId: 'p1' })
            expect(mockFind).toHaveBeenCalledTimes(3)
        })
    })
})
