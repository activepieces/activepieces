import { LockerKind } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis-connections'

const LOCK_TTL_SECONDS = 60
const KEY_PREFIX = 'lock:'
const AI_KEY_PREFIX = 'ai-lock:'

export const lockService = (log: FastifyBaseLogger) => ({
    async acquire({ resourceId, userId, userDisplayName, force, lockerKind, reason }: AcquireParams): Promise<AcquireResult> {
        log.debug({ resourceId, user: { id: userId }, force }, '[Lock] Attempting to acquire lock')
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + resourceId
        const value = JSON.stringify({ userId, userDisplayName, lockerKind, reason })

        if (force) {
            await redis.set(key, value, 'EX', LOCK_TTL_SECONDS)
            log.debug({ resourceId, user: { id: userId } }, '[Lock] Lock force-acquired')
            return { acquired: true, lock: null }
        }

        const setResult = await redis.set(key, value, 'EX', LOCK_TTL_SECONDS, 'NX')
        if (setResult !== null) {
            log.debug({ resourceId, user: { id: userId } }, '[Lock] Lock acquired')
            return { acquired: true, lock: null }
        }

        const existing = await redis.get(key)
        const lock: LockValue | null = existing ? JSON.parse(existing) : null

        if (lock && lock.userId === userId) {
            await redis.set(key, value, 'EX', LOCK_TTL_SECONDS)
            log.debug({ resourceId, user: { id: userId } }, '[Lock] Lock renewed (same user)')
            return { acquired: true, lock: null }
        }

        log.debug({ resourceId, user: { id: userId }, lockedByUserId: lock?.userId }, '[Lock] Lock already held by another user')
        return { acquired: false, lock }
    },

    async release({ resourceId, userId }: ReleaseParams): Promise<boolean> {
        log.debug({ resourceId, user: { id: userId } }, '[Lock] Attempting to release lock')
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + resourceId
        const existing = await redis.get(key)
        if (existing) {
            const lock: LockValue = JSON.parse(existing)
            if (lock.userId === userId) {
                await redis.del(key)
                log.debug({ resourceId, user: { id: userId } }, '[Lock] Lock released')
                return true
            }
            log.debug({ resourceId, user: { id: userId }, lockedByUserId: lock.userId }, '[Lock] Cannot release lock held by another user')
        }
        else {
            log.debug({ resourceId, user: { id: userId } }, '[Lock] No lock found to release')
        }
        return false
    },

    async getLock({ resourceId }: GetLockParams): Promise<LockValue | null> {
        const redis = await redisConnections.useExisting()
        const existing = await redis.get(KEY_PREFIX + resourceId)
        const lock = existing ? JSON.parse(existing) : null
        log.debug({ resourceId, hasLock: !!lock }, '[Lock] Get lock')
        return lock
    },

    // The agent's "I'm working on this resource" signal lives in its own key namespace, separate
    // from the human editing mutex above — it is a viewer-facing broadcast trigger, not a write
    // mutex (the agent's writes are not gated by any lock). Keeping it separate means a human who
    // already has the resource open (and thus holds the USER mutex) never blocks the AI signal.
    async announceAi({ resourceId, conversationId }: AnnounceAiParams): Promise<{ announced: boolean }> {
        const redis = await redisConnections.useExisting()
        const key = AI_KEY_PREFIX + resourceId
        const setResult = await redis.set(key, conversationId, 'EX', LOCK_TTL_SECONDS, 'NX')
        if (setResult !== null) {
            log.debug({ resourceId, conversation: { id: conversationId } }, '[Lock] AI announce (new)')
            return { announced: true }
        }
        await redis.set(key, conversationId, 'EX', LOCK_TTL_SECONDS, 'XX')
        log.debug({ resourceId, conversation: { id: conversationId } }, '[Lock] AI announce refreshed')
        return { announced: false }
    },

    async clearAi({ resourceId }: ClearAiParams): Promise<{ cleared: boolean }> {
        const redis = await redisConnections.useExisting()
        const removed = await redis.del(AI_KEY_PREFIX + resourceId)
        log.debug({ resourceId, cleared: removed > 0 }, '[Lock] AI clear')
        return { cleared: removed > 0 }
    },
})

type LockValue = {
    userId: string
    userDisplayName: string
    lockerKind?: LockerKind
    reason?: string
}

type AcquireParams = {
    resourceId: string
    userId: string
    userDisplayName: string
    force?: boolean
    lockerKind?: LockerKind
    reason?: string
}

type AcquireResult = {
    acquired: boolean
    lock: LockValue | null
}

type ReleaseParams = {
    resourceId: string
    userId: string
}

type GetLockParams = {
    resourceId: string
}

type AnnounceAiParams = {
    resourceId: string
    conversationId: string
}

type ClearAiParams = {
    resourceId: string
}
