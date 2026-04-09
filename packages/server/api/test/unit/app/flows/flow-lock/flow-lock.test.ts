import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRedisStore: Record<string, { value: string, ttl: number }> = {}

vi.mock('../../../../../src/app/database/redis/index', () => ({
    redisConnections: {
        useExisting: vi.fn().mockResolvedValue({
            get: vi.fn(async (key: string) => mockRedisStore[key]?.value ?? null),
            set: vi.fn(async (key: string, value: string, _ex: string, ttl: number, nx?: string) => {
                if (nx === 'NX' && mockRedisStore[key]) {
                    return null
                }
                mockRedisStore[key] = { value, ttl }
                return 'OK'
            }),
            del: vi.fn(async (key: string) => {
                delete mockRedisStore[key]
            }),
        }),
    },
}))

import { flowLockService } from '../../../../../src/app/flows/flow-lock/flow-lock.service'

const mockLog = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
} as unknown as Parameters<typeof flowLockService>[0]

const service = flowLockService(mockLog)

describe('FlowLockService', () => {
    const flowId = 'test-flow-id'

    beforeEach(() => {
        for (const key of Object.keys(mockRedisStore)) {
            delete mockRedisStore[key]
        }
    })

    it('acquires lock when no existing lock', async () => {
        const result = await service.acquire({
            flowId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        expect(result.acquired).toBe(true)
        expect(result.lock).toBeNull()
    })

    it('denies lock when locked by different user', async () => {
        await service.acquire({
            flowId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await service.acquire({
            flowId,
            userId: 'user2',
            userDisplayName: 'User 2',
        })
        expect(result.acquired).toBe(false)
        expect(result.lock).toMatchObject({ userId: 'user1', userDisplayName: 'User 1' })
    })

    it('allows same user to refresh lock', async () => {
        await service.acquire({
            flowId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await service.acquire({
            flowId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        expect(result.acquired).toBe(true)
    })

    it('allows force takeover', async () => {
        await service.acquire({
            flowId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await service.acquire({
            flowId,
            userId: 'user2',
            userDisplayName: 'User 2',
            force: true,
        })
        expect(result.acquired).toBe(true)
    })

    it('releases lock', async () => {
        await service.acquire({
            flowId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const released = await service.release({ flowId, userId: 'user1' })
        expect(released).toBe(true)
        const lock = await service.getLock({ flowId })
        expect(lock).toBeNull()
    })

    it('does not release lock held by another user', async () => {
        await service.acquire({
            flowId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const released = await service.release({ flowId, userId: 'user2' })
        expect(released).toBe(false)
        const lock = await service.getLock({ flowId })
        expect(lock).not.toBeNull()
    })

    it('returns null when no lock exists', async () => {
        const lock = await service.getLock({ flowId: 'nonexistent' })
        expect(lock).toBeNull()
    })
})
