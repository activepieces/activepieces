import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFindOne = vi.fn()
const mockUpdate = vi.fn()

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanRepo: () => ({
        findOne: mockFindOne,
        update: mockUpdate,
    }),
}))

const cache = new Map<string, unknown>()
const mockDistributedStoreGet = vi.fn(async (key: string) => cache.get(key) ?? null)
const mockDistributedStorePut = vi.fn(async (key: string, value: unknown) => {
    cache.set(key, value)
})
const mockDistributedStoreDelete = vi.fn(async (key: string) => {
    cache.delete(key)
})

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    redisConnections: { getRedisType: vi.fn().mockReturnValue('MEMORY') },
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

const CANARY_WORKER_GROUP_ID = 'canary'

async function loadService(): Promise<WorkerGroupService> {
    const mod = await import('../../../../../src/app/ee/platform/platform-plan/worker-group.service')
    return mod.workerGroupService(mockLog)
}

describe('workerGroupService', () => {
    let service: WorkerGroupService

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()
        cache.clear()
        service = await loadService()
    })

    describe('getWorkerGroupId', () => {
        it('returns groupId from DB when not cached', async () => {
            mockFindOne.mockResolvedValue({ workerGroupId: 'canary' })

            const result = await service.getWorkerGroupId({ platformId: 'p1' })

            expect(result).toBe('canary')
            expect(mockDistributedStorePut).toHaveBeenCalledWith('platform:p1:worker_group_id:v2', 'canary', expect.any(Number))
        })

        it('returns null and caches sentinel when platform has no worker group', async () => {
            mockFindOne.mockResolvedValue({ workerGroupId: null })

            const result = await service.getWorkerGroupId({ platformId: 'p2' })

            expect(result).toBeNull()
            expect(mockDistributedStorePut).toHaveBeenCalledWith('platform:p2:worker_group_id:v2', '__none__', expect.any(Number))
        })

        it('returns null without hitting DB when sentinel is cached', async () => {
            cache.set('platform:p3:worker_group_id:v2', '__none__')

            const result = await service.getWorkerGroupId({ platformId: 'p3' })

            expect(result).toBeNull()
            expect(mockFindOne).not.toHaveBeenCalled()
        })

        it('returns cached value without hitting DB', async () => {
            cache.set('platform:p1:worker_group_id:v2', 'my-group')

            const result = await service.getWorkerGroupId({ platformId: 'p1' })

            expect(result).toBe('my-group')
            expect(mockFindOne).not.toHaveBeenCalled()
        })
    })

    describe('isCanaryPlatform', () => {
        it('is true when the platform runs on the canary worker group', async () => {
            mockFindOne.mockResolvedValue({ workerGroupId: CANARY_WORKER_GROUP_ID })

            expect(await service.isCanaryPlatform({ platformId: 'p1' })).toBe(true)
        })

        it('is false when the platform runs on another worker group', async () => {
            mockFindOne.mockResolvedValue({ workerGroupId: 'not-canary' })

            expect(await service.isCanaryPlatform({ platformId: 'p1' })).toBe(false)
        })

        it('is false when the platform has no worker group', async () => {
            mockFindOne.mockResolvedValue({ workerGroupId: null })

            expect(await service.isCanaryPlatform({ platformId: 'p1' })).toBe(false)
        })

        it('answers from the cache on a repeat call, so the platform is read once', async () => {
            mockFindOne.mockResolvedValue({ workerGroupId: CANARY_WORKER_GROUP_ID })

            await service.isCanaryPlatform({ platformId: 'p1' })
            await service.isCanaryPlatform({ platformId: 'p1' })

            expect(mockFindOne).toHaveBeenCalledTimes(1)
        })
    })

    describe('updateWorkerGroup', () => {
        it('drops the cached group, so the next read sees the new one', async () => {
            mockUpdate.mockResolvedValue(undefined)
            mockFindOne.mockResolvedValue({ workerGroupId: CANARY_WORKER_GROUP_ID })
            expect(await service.getWorkerGroupId({ platformId: 'p1' })).toBe(CANARY_WORKER_GROUP_ID)

            await service.updateWorkerGroup({ platformId: 'p1', workerGroupId: null })

            mockFindOne.mockResolvedValue({ workerGroupId: null })
            expect(await service.getWorkerGroupId({ platformId: 'p1' })).toBeNull()
            expect(mockFindOne).toHaveBeenCalledTimes(2)
        })
    })

    describe('updateCanary', () => {
        it('moves the platform onto the canary group and drops the cached value', async () => {
            mockUpdate.mockResolvedValue(undefined)
            mockFindOne.mockResolvedValue({ workerGroupId: null })
            expect(await service.isCanaryPlatform({ platformId: 'p1' })).toBe(false)

            await service.updateCanary({ platformId: 'p1', canary: true })

            expect(mockUpdate).toHaveBeenCalledWith({ platformId: 'p1' }, { workerGroupId: CANARY_WORKER_GROUP_ID })
            mockFindOne.mockResolvedValue({ workerGroupId: CANARY_WORKER_GROUP_ID })
            expect(await service.isCanaryPlatform({ platformId: 'p1' })).toBe(true)
        })
    })
})
