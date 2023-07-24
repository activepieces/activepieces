import { captureException } from '../helper/logger'
import RedLock from 'redlock'
import { QueueMode, queueMode } from '../workers/flow-worker/queues/queue'
import { Redis } from 'ioredis'
import { createRedisClient } from '../database/redis-connection'
import { Mutex } from 'async-mutex'

let redLock: RedLock
let redisConnection: Redis
const memoryLocks = new Map<string, MutexLockWrapper>()

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
        case QueueMode.REDIS:{
            redisConnection = createRedisClient()
            redLock = new RedLock(
                [redisConnection],
                {
                    driftFactor: 0.01,
                    retryCount: 30,
                    retryDelay: 2000,
                    retryJitter: 200,
                    automaticExtensionThreshold: 500,
                },
            )
            break
        }
        case QueueMode.MEMORY:{
            break
        }
    }
}

type ApLock = {
    release(): Promise<unknown>
}

type AcquireLockParams = {
    key: string
    timeout?: number
}


export const acquireLock = async ({ key, timeout = 3000 }: AcquireLockParams): Promise<ApLock> => {
    switch (queueMode) {
        case QueueMode.REDIS:
            return acquireRedisLock(key, timeout)
        case QueueMode.MEMORY:
            return acquireMemoryLock(key)
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


const acquireRedisLock = async (key: string, timeout: number): Promise<ApLock> => {
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
}

initializeLock()