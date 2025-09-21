import { ApLock, exceptionHandler } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'
import RedLock from 'redlock'
import { redisConnections } from '../database/redis'

let redLock: RedLock
let redisConnection: Redis

export const distributedLock = {
    init: async (): Promise<void> => {
        redisConnection = await redisConnections.createNew()
        redLock = new RedLock([redisConnection], {
            driftFactor: 0.01,
            retryCount: 30,
            retryDelay: 2000,
            retryJitter: 200,
            automaticExtensionThreshold: 500,
        })
    },
    acquireLock: async ({ key, timeout = 3000, log }: AcquireLockParams): Promise<ApLock> => {
        try {
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


type AcquireLockParams = {
    key: string
    timeout?: number
    log: FastifyBaseLogger
}
