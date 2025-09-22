import { ApLock, exceptionHandler } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { FastifyBaseLogger } from 'fastify'
import RedLock from 'redlock'
import { redisConnections } from '../database/redis'

const lockMutex = new Mutex()

export const distributedLock = {
    acquireLock: async ({ key, timeout = 3000, log }: AcquireLockParams): Promise<ApLock> => {
        try {
            const redLock = await getOrCreateRedLock()
            return await redLock.acquire([key], timeout, {
                retryCount: Math.ceil(timeout / 2000) * 2,
                retryDelay: 2000,
            })
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            throw e
        }
    },
}

let _redLock: RedLock

function getOrCreateRedLock(): Promise<RedLock> {
    return lockMutex.runExclusive(async () => {
        if (!isNil(_redLock)) {
            return _redLock
        }
        const redisConnection = await redisConnections.createNew()
        _redLock = new RedLock([redisConnection], {
            driftFactor: 0.01,
            retryCount: 30,
        })
        return _redLock
    })
}


type AcquireLockParams = {
    key: string
    timeout?: number
    log: FastifyBaseLogger
}
