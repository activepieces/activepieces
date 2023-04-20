import Redis from 'ioredis'
import RedLock, { Lock } from 'redlock'
import { captureException } from '@sentry/node'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'

const url = system.get(SystemProp.REDIS_URL)
const username = system.get(SystemProp.REDIS_USER)
const password = system.get(SystemProp.REDIS_PASSWORD)
const useSsl = system.get(SystemProp.REDIS_USE_SSL) ?? false

export const createRedisClient = (): Redis => {
    if (url) return new Redis(url)

    const host = system.getOrThrow(SystemProp.REDIS_HOST)
    const serializedPort = system.getOrThrow(SystemProp.REDIS_PORT)
    const port = Number.parseInt(serializedPort, 10)

    return new Redis({
        host,
        port,
        username: username,
        password: password,
        maxRetriesPerRequest: null,
        tls: useSsl ? {} : undefined,
    })
}

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

type AcquireLockParams = {
    key: string
    timeout?: number
}

export const acquireLock = async ({ key, timeout = 3000 }: AcquireLockParams): Promise<Lock> => {
    try {
        return await redLock.acquire([key], timeout, {
            retryCount: Math.ceil(timeout / 2000) * 2,
            retryDelay: 2000,
        })
    }
    catch (e) {
        captureException(e)
        throw e
    }
}
