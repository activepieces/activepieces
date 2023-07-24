/*import { createRedisClient } from '../database/redis-connection'
import { captureException } from '../helper/logger'
import RedLock, { Lock } from 'redlock'

const redisConnection = createRedisClient()

const redLock = new RedLock(
    [redisConnection],
    {
        driftFactor: 0.01,
        retryCount: 30,
        retryDelay: 2000,
        retryJitter: 200,
        automaticExtensionThreshold: 500,
    },
)

export const acquireLock = async ({ key, timeout = 3000 }: AcquireLockParams): Promise<Lock> => {
    try {
        return redLock.acquire([key], timeout, {
            retryCount: Math.ceil(timeout / 2000) * 2,
            retryDelay: 2000,
        })
    }
    catch (e) {
        captureException(e)
        throw e
    }
}*/


type AcquireLockParams = {
    key: string
    timeout?: number
}

export class NormalLock {
    private isLocked = false
    private lockTimeout: NodeJS.Timeout | null = null

    async acquire(timeout: number): Promise<void> {
        if (this.isLocked) {
            throw new Error('Lock is already acquired.')
        }

        this.isLocked = true

        return new Promise<void>((resolve) => {
            this.lockTimeout = setTimeout(() => {
                this.release()
            }, timeout)
            resolve()
        })
    }

    async release(): Promise<void> {
        if (this.isLocked) {
            this.isLocked = false
            if (this.lockTimeout) {
                clearTimeout(this.lockTimeout)
                this.lockTimeout = null
            }
        }
    }
}

export const acquireLock = async ({ timeout = 3000 }: AcquireLockParams): Promise<NormalLock> => {
    const lock = new NormalLock()

    await lock.acquire(timeout)
    return lock
}
