import Redis from 'ioredis'
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
        username,
        password,
        maxRetriesPerRequest: null,
        tls: useSsl ? {} : undefined,
    })
}
