import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis/index'

const LOCK_TTL_SECONDS = 60
const KEY_PREFIX = 'flow-lock:'

export const flowLockService = (log: FastifyBaseLogger) => ({
    async acquire({ flowId, userId, userDisplayName, force }: AcquireParams): Promise<AcquireResult> {
        log.info({ flowId, userId, force }, '[FlowLock] Attempting to acquire lock')
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + flowId
        const existing = await redis.get(key)

        if (existing) {
            const lock: FlowLockValue = JSON.parse(existing)
            if (lock.userId === userId || force) {
                log.info({ flowId, userId, force, previousUserId: lock.userId }, '[FlowLock] Reacquiring lock (same user or force)')
                await redis.set(key, JSON.stringify({ userId, userDisplayName }), 'EX', LOCK_TTL_SECONDS)
                return { acquired: true, lock: null }
            }
            log.info({ flowId, userId, lockedByUserId: lock.userId, lockedByDisplayName: lock.userDisplayName }, '[FlowLock] Lock already held by another user')
            return { acquired: false, lock }
        }

        await redis.set(key, JSON.stringify({ userId, userDisplayName }), 'EX', LOCK_TTL_SECONDS)
        log.info({ flowId, userId }, '[FlowLock] Lock acquired')
        return { acquired: true, lock: null }
    },

    async release({ flowId, userId }: ReleaseParams): Promise<boolean> {
        log.info({ flowId, userId }, '[FlowLock] Attempting to release lock')
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + flowId
        const existing = await redis.get(key)
        if (existing) {
            const lock: FlowLockValue = JSON.parse(existing)
            if (lock.userId === userId) {
                await redis.del(key)
                log.info({ flowId, userId }, '[FlowLock] Lock released')
                return true
            }
            log.info({ flowId, userId, lockedByUserId: lock.userId }, '[FlowLock] Cannot release lock held by another user')
        }
        else {
            log.info({ flowId, userId }, '[FlowLock] No lock found to release')
        }
        return false
    },

    async getLock({ flowId }: GetLockParams): Promise<FlowLockValue | null> {
        const redis = await redisConnections.useExisting()
        const existing = await redis.get(KEY_PREFIX + flowId)
        const lock = existing ? JSON.parse(existing) : null
        log.debug({ flowId, hasLock: !!lock }, '[FlowLock] Get lock')
        return lock
    },
})

type FlowLockValue = {
    userId: string
    userDisplayName: string
}

type AcquireParams = {
    flowId: string
    userId: string
    userDisplayName: string
    force?: boolean
}

type AcquireResult = {
    acquired: boolean
    lock: FlowLockValue | null
}

type ReleaseParams = {
    flowId: string
    userId: string
}

type GetLockParams = {
    flowId: string
}
