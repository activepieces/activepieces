import { Mutex } from 'async-mutex'
import { Redis } from 'ioredis'
import RedLock from 'redlock'
import { createRedisClient } from '../database/redis-connection'
import { exceptionHandler, QueueMode, system, SystemProp } from '@activepieces/server-shared'

let redLock: RedLock
let redisConnection: Redis
const memoryLocks = new Map<string, MutexLockWrapper>()
const queueMode = system.get(SystemProp.QUEUE_MODE)!
class MutexLockWrapper {
    private lock: Mutex

    constructor() {
        this.lock = new Mutex()
    }

    async acquire(): Promise<void> {
        await this.lock.acquire()
    }

    async release(): Promise<void> {
        this.lock.release()
    }
}

const initializeLock = () => {
    switch (queueMode) {
        case QueueMode.REDIS: {
            redisConnection = createRedisClient()
            redLock = new RedLock([redisConnection], {
                driftFactor: 0.01,
                retryCount: 30,
                retryDelay: 2000,
                retryJitter: 200,
                automaticExtensionThreshold: 500,
            })
            break
        }
        case QueueMode.MEMORY: {
            break
        }
    }
}

const acquireMemoryLock = async (key: string): Promise<ApLock> => {
    let lock = memoryLocks.get(key)
    if (!lock) {
        lock = new MutexLockWrapper()
        memoryLocks.set(key, lock)
    }
    await lock.acquire()
    return lock
}

const acquireRedisLock = async (
    key: string,
    timeout: number,
): Promise<ApLock> => {
    try {
        return await redLock.acquire([key], timeout, {
            retryCount: Math.ceil(timeout / 2000) * 2,
            retryDelay: 2000,
        })
    }
    catch (e) {
        exceptionHandler.handle(e)
        throw e
    }
}

type AcquireLockParams = {
    key: string
    timeout?: number
}

export type ApLock = {
    release(): Promise<unknown>
}

export const acquireLock = async ({
    key,
    timeout = 3000,
}: AcquireLockParams): Promise<ApLock> => {
    switch (queueMode) {
        case QueueMode.REDIS:
            return acquireRedisLock(key, timeout)
        case QueueMode.MEMORY:
            return acquireMemoryLock(key)
        default:
            throw new Error(`Unknown queue mode: ${queueMode}`)
    }
}

initializeLock()
