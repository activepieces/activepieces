import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis-connections'

const LOCK_TTL_SECONDS = 60
const KEY_PREFIX = 'lock:'

export const lockService = (log: FastifyBaseLogger) => ({
    async acquire({ resourceId, userId, userDisplayName, force }: AcquireParams): Promise<AcquireResult> {
        log.debug({ resourceId, userId, force }, '[Lock] Attempting to acquire lock')
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + resourceId
        const value = JSON.stringify({ userId, userDisplayName })

        if (force) {
            await redis.set(key, value, 'EX', LOCK_TTL_SECONDS)
            log.debug({ resourceId, userId }, '[Lock] Lock force-acquired')
            return { acquired: true, lock: null }
        }

        const setResult = await redis.set(key, value, 'EX', LOCK_TTL_SECONDS, 'NX')
        if (setResult !== null) {
            log.debug({ resourceId, userId }, '[Lock] Lock acquired')
            return { acquired: true, lock: null }
        }

        const existing = await redis.get(key)
        const lock: LockValue | null = existing ? JSON.parse(existing) : null

        if (lock && lock.userId === userId) {
            await redis.set(key, value, 'EX', LOCK_TTL_SECONDS)
            log.debug({ resourceId, userId }, '[Lock] Lock renewed (same user)')
            return { acquired: true, lock: null }
        }

        log.debug({ resourceId, userId, lockedByUserId: lock?.userId }, '[Lock] Lock already held by another user')
        return { acquired: false, lock }
    },

    async release({ resourceId, userId }: ReleaseParams): Promise<boolean> {
        log.debug({ resourceId, userId }, '[Lock] Attempting to release lock')
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + resourceId
        const existing = await redis.get(key)
        if (existing) {
            const lock: LockValue = JSON.parse(existing)
            if (lock.userId === userId) {
                await redis.del(key)
                log.debug({ resourceId, userId }, '[Lock] Lock released')
                return true
            }
            log.debug({ resourceId, userId, lockedByUserId: lock.userId }, '[Lock] Cannot release lock held by another user')
        }
        else {
            log.debug({ resourceId, userId }, '[Lock] No lock found to release')
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
})

type LockValue = {
    userId: string
    userDisplayName: string
}

type AcquireParams = {
    resourceId: string
    userId: string
    userDisplayName: string
    force?: boolean
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
