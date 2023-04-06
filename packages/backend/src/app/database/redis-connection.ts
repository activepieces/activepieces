import Redis from 'ioredis'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import Redlock from 'redlock'
import { captureException } from '@sentry/node'


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

const redisConection = createRedisClient()
const redlock = new Redlock(
    [redisConection],
    {
        driftFactor: 0.01,
        retryCount: 30,
        retryDelay: 2000,
        retryJitter: 200,
        automaticExtensionThreshold: 500,
    },
)

export const acquireLock = (resources: string[], {
    timeout = 30000,
}) => {
    try {
        return redlock.acquire(resources, timeout, {
            retryCount: Math.ceil(timeout / 2000) * 2,
            retryDelay: 2000,
        })
    } 
    catch (e) {
        captureException(e)
    }
}

