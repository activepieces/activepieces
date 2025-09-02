import fs from 'fs'

import { AppSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import Redis, { RedisOptions } from 'ioredis'
import { RedisType, system } from '../helper/system/system'

const redisConnectionMode = system.getOrThrow(AppSystemProp.REDIS_TYPE)
const url = system.get(AppSystemProp.REDIS_URL)
const password = system.get(AppSystemProp.REDIS_PASSWORD)
const useSsl = system.getBoolean(AppSystemProp.REDIS_USE_SSL) ?? false
const sslCaFile = system.get(AppSystemProp.REDIS_SSL_CA_FILE)

const readCAFile = (file: string | undefined): string | undefined => {
    if (isNil(file)) {
        return undefined
    }
    return fs.readFileSync(file, { encoding: 'utf8' })
}

const createStandaloneClient = (config: Partial<RedisOptions>): Redis => {
    const host = system.getOrThrow(AppSystemProp.REDIS_HOST)
    const serializedPort = system.getOrThrow(AppSystemProp.REDIS_PORT)
    const username = system.get(AppSystemProp.REDIS_USER)
    const port = Number.parseInt(serializedPort, 10)
    const db = system.getNumber(AppSystemProp.REDIS_DB) ?? 0

    return new Redis({
        ...config,
        host,
        port,
        username,
        password,
        db,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        tls: useSsl ? {
            ca: readCAFile(sslCaFile),
        } : undefined,
    })
}

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
    switch (redisConnectionMode) {
        case RedisType.SENTINEL:
            return createSentinelClient(config)
        case RedisType.DEFAULT:
        default:
            return createStandaloneClient(config)
    }
}


const createSentinelClient = (config: Partial<RedisOptions>): Redis => {
    const sentinelList = system.getOrThrow(AppSystemProp.REDIS_SENTINEL_HOSTS)
    const sentinelName = system.getOrThrow(AppSystemProp.REDIS_SENTINEL_NAME)
    const sentinelrole = system.get<'master' | 'slave'>(AppSystemProp.REDIS_SENTINEL_ROLE)
    const username = system.get(AppSystemProp.REDIS_USER)

    const sentinels = sentinelList.split(',').map((sentinel) => {
        const [host, port] = sentinel.split(':')
        return { host, port: Number.parseInt(port, 10) }
    })
    const tlsCa = readCAFile(sslCaFile)
    const redisOptions: RedisOptions = {
        ...config,
        ...({ sentinels }),
        name: sentinelName,
        username,
        password,
        role: sentinelrole,
        ...getTlsOptionsForSentinel(useSsl, tlsCa),
        lazyConnect: true,
    }
    return new Redis(redisOptions)
}

const getTlsOptionsForSentinel = (useSsl: boolean, tlsCa: string | undefined): Partial<RedisOptions> => {
    if (!useSsl) {
        return {}
    }
    return {
        enableTLSForSentinelMode: true,
        tls: {
            ca: tlsCa,
        },
        sentinelTLS: {
            ca: tlsCa,
        },
    }
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