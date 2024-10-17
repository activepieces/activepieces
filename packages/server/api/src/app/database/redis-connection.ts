import fs from 'fs'

import { AppSystemProp,  RedisType, system } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import Redis, { RedisOptions } from 'ioredis'

const redisConnectionMode = system.get(AppSystemProp.REDIS_TYPE)
const url = system.get(AppSystemProp.REDIS_URL)
const username = system.get(AppSystemProp.REDIS_USER)
const password = system.getOrThrow(AppSystemProp.REDIS_PASSWORD)
const role = system.get<'master' | 'slave'>(AppSystemProp.REDIS_SENTINEL_ROLE)
const useSsl = system.getBoolean(AppSystemProp.REDIS_USE_SSL) ?? false
const sslCaFile = system.get(AppSystemProp.REDIS_SSL_CA_FILE)
const sentinelList = system.get(AppSystemProp.REDIS_SENTINEL_HOSTS)
const sentinelName = system.get(AppSystemProp.REDIS_SENTINEL_NAME)
const db = system.getNumber(AppSystemProp.REDIS_DB) ?? 0

const readCAFile = (file: string | undefined): string | undefined => {
    if (isNil(file)) {
        return undefined
    }
    return fs.readFileSync(file, { encoding: 'utf8' })
}

const createStandaloneClient = (config: Partial<RedisOptions>): Redis => {
    if (url) {
        return new Redis(url, {
            ...config,
        })
    }

    const host = system.getOrThrow(AppSystemProp.REDIS_HOST)
    const serializedPort = system.getOrThrow(AppSystemProp.REDIS_PORT)
    const port = Number.parseInt(serializedPort, 10)

    return new Redis({
        ...config,
        host,
        port,
        username,
        password,
        db,
        tls: useSsl ? {
            ca: readCAFile(sslCaFile),
        } : undefined,
    })
}

export const createRedisClient = (params?: CreateRedisClientParams): Redis => {
    if (url) {
        return new Redis(url, {
            ...params,
        })
    }
    const config: Partial<RedisOptions> = {
        maxRetriesPerRequest: null,
        ...params,
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
    assertNotNullOrUndefined(sentinelList, 'REDIS_SENTINEL_HOSTS')

    const sentinels = sentinelList.split(',').map((sentinel) => {
        const [host, port] = sentinel.split(':')
        return { host, port: Number.parseInt(port, 10) }
    })
    const tlsCa = readCAFile(sslCaFile)
    const redisOptions: RedisOptions = {
        ...config,
        ...({ sentinels }),
        name: sentinelName,
        password,
        role,
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
