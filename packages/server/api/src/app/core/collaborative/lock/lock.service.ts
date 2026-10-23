import { isNil } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis-connections'

const LOCK_TTL_SECONDS = 60
const KEY_PREFIX = 'lock:'

export const lockService = (log: FastifyBaseLogger) => ({
    async acquire({ resourceId, projectId, userId, userDisplayName, editorSessionId, force }: AcquireParams): Promise<AcquireResult> {
        log.debug({ resourceId, user: { id: userId }, force }, '[Lock] Attempting to acquire lock')
        const redis = await redisConnections.useExisting()
        const key = buildKey({ resourceId, projectId })
        const value = JSON.stringify({ userId, userDisplayName, editorSessionId: editorSessionId ?? null })

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

        if (lock && isSameOwner({ lock, userId, editorSessionId })) {
            await redis.set(key, value, 'EX', LOCK_TTL_SECONDS)
            log.debug({ resourceId, user: { id: userId } }, '[Lock] Lock renewed (same editor session)')
            return { acquired: true, lock: null }
        }

        log.debug({ resourceId, user: { id: userId }, lockedByUserId: lock?.userId }, '[Lock] Lock already held by another editor session')
        return { acquired: false, lock: isNil(lock) ? null : { userId: lock.userId, userDisplayName: lock.userDisplayName } }
    },

    async release({ resourceId, projectId, userId, editorSessionId }: ReleaseParams): Promise<boolean> {
        log.debug({ resourceId, user: { id: userId } }, '[Lock] Attempting to release lock')
        const redis = await redisConnections.useExisting()
        const key = buildKey({ resourceId, projectId })
        const existing = await redis.get(key)
        if (existing) {
            const lock: LockValue = JSON.parse(existing)
            if (isSameOwner({ lock, userId, editorSessionId })) {
                await redis.del(key)
                log.debug({ resourceId, user: { id: userId } }, '[Lock] Lock released')
                return true
            }
            log.debug({ resourceId, user: { id: userId }, lockedByUserId: lock.userId }, '[Lock] Cannot release lock held by another editor session')
        }
        else {
            log.debug({ resourceId, user: { id: userId } }, '[Lock] No lock found to release')
        }
        return false
    },

    async getLock({ resourceId, projectId }: GetLockParams): Promise<LockValue | null> {
        const redis = await redisConnections.useExisting()
        const existing = await redis.get(buildKey({ resourceId, projectId }))
        const lock = existing ? JSON.parse(existing) : null
        log.debug({ resourceId, hasLock: !!lock }, '[Lock] Get lock')
        return lock
    },
})

function buildKey({ resourceId, projectId }: KeyParams): string {
    return `${KEY_PREFIX}${projectId}:${resourceId}`
}

function isSameOwner({ lock, userId, editorSessionId }: SameOwnerParams): boolean {
    if (lock.userId !== userId) {
        return false
    }
    return isNil(lock.editorSessionId) || isNil(editorSessionId) || lock.editorSessionId === editorSessionId
}

type LockValue = {
    userId: string
    userDisplayName: string
    editorSessionId?: string | null
}

type LockHolder = {
    userId: string
    userDisplayName: string
}

type SameOwnerParams = {
    lock: LockValue
    userId: string
    editorSessionId?: string | null
}

type KeyParams = {
    resourceId: string
    projectId: string
}

type AcquireParams = {
    resourceId: string
    projectId: string
    userId: string
    userDisplayName: string
    editorSessionId?: string | null
    force?: boolean
}

type AcquireResult = {
    acquired: boolean
    lock: LockHolder | null
}

type ReleaseParams = {
    resourceId: string
    projectId: string
    userId: string
    editorSessionId?: string | null
}

type GetLockParams = {
    resourceId: string
    projectId: string
}
