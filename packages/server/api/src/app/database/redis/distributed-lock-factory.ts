import { isNil } from '@activepieces/core-utils'
import { Mutex } from 'async-mutex'
import { FastifyBaseLogger } from 'fastify'
import Redis from 'ioredis'
import RedLock from 'redlock'

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
                automaticExtensionThreshold: 1000,
            })
            return redLock
        })
    }

    return (_log: FastifyBaseLogger) => ({
        runExclusive: async <T>({
            key,
            timeoutInSeconds,
            retryDelayMs = DEFAULT_RETRY_DELAY_MS,
            retryJitterMs = DEFAULT_RETRY_JITTER_MS,
            fn,
        }: RunExclusiveParams<T>): Promise<T> => {
            const timeout = timeoutInSeconds * 1000
            const redLockInstance = await getOrCreateRedLock()
            return redLockInstance.using(
                [key],
                timeout,
                {
                    retryCount: Math.ceil(timeout / retryDelayMs),
                    retryDelay: retryDelayMs,
                    retryJitter: retryJitterMs,
                    automaticExtensionThreshold: 2000,
                    driftFactor: 0.01,
                },
                async () => fn(),
            )
        },
        destroy: async (): Promise<void> => {
            if (redLock) {
                await redLock.quit()
                redLock = undefined
            }
        },
    })
}

type RunExclusiveParams<T> = {
    key: string
    timeoutInSeconds: number
    retryDelayMs?: number
    retryJitterMs?: number
    fn: () => Promise<T>
}

const DEFAULT_RETRY_DELAY_MS = 200
const DEFAULT_RETRY_JITTER_MS = 100
