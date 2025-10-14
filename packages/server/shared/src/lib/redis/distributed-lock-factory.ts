import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { FastifyBaseLogger } from 'fastify'
import Redis from 'ioredis'
import RedLock from 'redlock'
import { exceptionHandler } from '../exception-handler'
import { ApLock } from '../memory-lock'

export const distributedLockFactory = (
    createRedisConnection: () => Promise<Redis>,
) => {
    const lockMutex = new Mutex()
    let redLock: RedLock | undefined

    const getOrCreateRedLock = async (): Promise<RedLock> => {
        return lockMutex.runExclusive(async () => {
            if (!isNil(redLock)) {
                return redLock
            }
            const redisClient = await createRedisConnection()
            redLock = new RedLock([redisClient], {
                driftFactor: 0.01,
                retryCount: 30,
            })
            return redLock
        })
    }

    return (log: FastifyBaseLogger) => ({
        runExclusive: async <T>({
            key,
            timeoutInSeconds,
            fn,
        }: RunExclusiveParams<T>): Promise<T> => {
            const timeout = timeoutInSeconds * 1000
            let lock: ApLock | undefined
            try {
                const redLockInstance = await getOrCreateRedLock()
                lock = await redLockInstance.acquire([key], timeout, {
                    retryCount: Math.ceil(timeout / 2000) * 2,
                    retryDelay: 2000,
                })
                return await fn()
            }
            catch (e) {
                exceptionHandler.handle(e, log)
                throw e
            }
            finally {
                if (lock) {
                    try {
                        await lock.release()
                    }
                    catch (releaseErr) {
                        exceptionHandler.handle(releaseErr, log)
                    }
                }
            }
        },
    })
}

type RunExclusiveParams<T> = {
    key: string
    timeoutInSeconds: number
    fn: () => Promise<T>
}
