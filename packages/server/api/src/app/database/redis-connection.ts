import { isNil } from '@activepieces/shared'
import Redis, { RedisOptions } from 'ioredis'
import { system, SystemProp } from 'server-shared'

const url = system.get(SystemProp.REDIS_URL)
const username = system.get(SystemProp.REDIS_USER)
const password = system.get(SystemProp.REDIS_PASSWORD)
const useSsl = system.get(SystemProp.REDIS_USE_SSL) ?? false
const db = system.getNumber(SystemProp.REDIS_DB) ?? 0

export const createRedisClient = (params?: CreateRedisClientParams): Redis => {
    const config: Partial<RedisOptions> = {
        maxRetriesPerRequest: null,
        ...params,
    }

    if (url) {
        return new Redis(url, {
            ...config,
        })
    }

    const host = system.getOrThrow(SystemProp.REDIS_HOST)
    const serializedPort = system.getOrThrow(SystemProp.REDIS_PORT)
    const port = Number.parseInt(serializedPort, 10)

    return new Redis({
        ...config,
        host,
        port,
        username,
        password,
        db,
        tls: useSsl ? {} : undefined,
    })
}

type CreateRedisClientParams = {
    /**
   * connection timeout in milliseconds
   */
    connectTimeout?: number
    maxRetriesPerRequest?: number
}

export const getRedisConnection = (() => {
    let redis: Redis | null = null

    return (): Redis => {
        if (!isNil(redis)) {
            return redis
        }
        redis = createRedisClient()
        return redis
    }
})()
