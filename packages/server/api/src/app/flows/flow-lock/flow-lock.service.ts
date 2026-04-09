import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis/index'

const LOCK_TTL_SECONDS = 60
const KEY_PREFIX = 'flow-lock:'

export const flowLockService = (log: FastifyBaseLogger) => ({
    async acquire({ flowId, userId, userDisplayName, force }: AcquireParams): Promise<AcquireResult> {
        log.info({ flowId, userId, force }, '[FlowLock] Attempting to acquire lock')
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + flowId
        const value = JSON.stringify({ userId, userDisplayName })

        if (force) {
            await redis.set(key, value, 'EX', LOCK_TTL_SECONDS)
            log.info({ flowId, userId }, '[FlowLock] Lock force-acquired')
            return { acquired: true, lock: null }
        }

        const setResult = await redis.set(key, value, 'EX', LOCK_TTL_SECONDS, 'NX')
        if (setResult !== null) {
            log.info({ flowId, userId }, '[FlowLock] Lock acquired')
            return { acquired: true, lock: null }
        }

        const existing = await redis.get(key)
        const lock: FlowLockValue | null = existing ? JSON.parse(existing) : null

        if (lock && lock.userId === userId) {
            await redis.set(key, value, 'EX', LOCK_TTL_SECONDS)
            log.info({ flowId, userId }, '[FlowLock] Lock renewed (same user)')
            return { acquired: true, lock: null }
        }

        log.info({ flowId, userId, lockedByUserId: lock?.userId }, '[FlowLock] Lock already held by another user')
        return { acquired: false, lock }
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
