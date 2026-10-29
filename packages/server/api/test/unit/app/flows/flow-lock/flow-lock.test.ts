import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRedisStore: Record<string, { value: string, ttl: number }> = {}

vi.mock('../../../../../src/app/database/redis-connections', () => ({
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

import { lockService } from '../../../../../src/app/core/collaborative/lock/lock.service'

const mockLog = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
} as unknown as Parameters<typeof lockService>[0]

const service = lockService(mockLog)

describe('LockService', () => {
    const resourceId = 'test-flow-id'

    beforeEach(() => {
        for (const key of Object.keys(mockRedisStore)) {
            delete mockRedisStore[key]
        }
    })

    it('acquires lock when no existing lock', async () => {
        const result = await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        expect(result.acquired).toBe(true)
        expect(result.lock).toBeNull()
    })

    it('denies lock when locked by different user', async () => {
        await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await service.acquire({
            resourceId,
            userId: 'user2',
            userDisplayName: 'User 2',
        })
        expect(result.acquired).toBe(false)
        expect(result.lock).toMatchObject({ userId: 'user1', userDisplayName: 'User 1' })
    })

    it('allows same user to refresh lock', async () => {
        await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        expect(result.acquired).toBe(true)
    })

    it('allows force takeover', async () => {
        await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await service.acquire({
            resourceId,
            userId: 'user2',
            userDisplayName: 'User 2',
            force: true,
        })
        expect(result.acquired).toBe(true)
    })

    it('releases lock', async () => {
        await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const released = await service.release({ resourceId, userId: 'user1' })
        expect(released).toBe(true)
        const lock = await service.getLock({ resourceId })
        expect(lock).toBeNull()
    })

    it('does not release lock held by another user', async () => {
        await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const released = await service.release({ resourceId, userId: 'user2' })
        expect(released).toBe(false)
        const lock = await service.getLock({ resourceId })
        expect(lock).not.toBeNull()
    })

    it('returns null when no lock exists', async () => {
        const lock = await service.getLock({ resourceId: 'nonexistent' })
        expect(lock).toBeNull()
    })

    describe('with an editor session', () => {
        it('denies the lock to the same user in another editor session and names the holder without its session', async () => {
            await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            const result = await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionB' })
            expect(result.acquired).toBe(false)
            expect(result.lock).toEqual({ userId: 'user1', userDisplayName: 'User 1' })
        })

        it('renews the lock for the same editor session', async () => {
            await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            const result = await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            expect(result.acquired).toBe(true)
        })

        it('denies the lock to another user who sends the session of the holder', async () => {
            await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            const result = await service.acquire({ resourceId, userId: 'user2', userDisplayName: 'User 2', editorSessionId: 'sessionA' })
            expect(result.acquired).toBe(false)
        })

        it('gives the lock to another editor session of the same user on a force acquire', async () => {
            await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            const takeOver = await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionB', force: true })
            expect(takeOver.acquired).toBe(true)
            const renewByLoser = await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            expect(renewByLoser.acquired).toBe(false)
        })

        it('does not release the lock for another editor session of the same user', async () => {
            await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            const released = await service.release({ resourceId, userId: 'user1', editorSessionId: 'sessionB' })
            expect(released).toBe(false)
            expect(await service.getLock({ resourceId })).not.toBeNull()
        })

        it('releases the lock for the editor session that holds it', async () => {
            await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            const released = await service.release({ resourceId, userId: 'user1', editorSessionId: 'sessionA' })
            expect(released).toBe(true)
        })

        it('lets a client with a session renew a lock taken without one, and then keeps it for that session', async () => {
            await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1' })
            const renew = await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            expect(renew.acquired).toBe(true)
            const otherSession = await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionB' })
            expect(otherSession.acquired).toBe(false)
        })

        it('keeps the per-user lock for a client that sends no session', async () => {
            await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1', editorSessionId: 'sessionA' })
            const result = await service.acquire({ resourceId, userId: 'user1', userDisplayName: 'User 1' })
            expect(result.acquired).toBe(true)
        })
    })
})
