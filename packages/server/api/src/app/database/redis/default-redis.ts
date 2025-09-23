import fs from 'fs'
import { AppSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import Redis, { RedisOptions } from 'ioredis'
import { system } from '../../helper/system/system'


export async function createDefaultRedisConnection(): Promise<Redis> {
    const config: Partial<RedisOptions> = {
        maxRetriesPerRequest: null,
    }

    const url = system.get(AppSystemProp.REDIS_URL)
    if (isNil(url)) {
        return createStandaloneRedisConnection(config)
    }
    return createRedisConnectionUsingUrl(config)
}

function createRedisConnectionUsingUrl(config: Partial<RedisOptions>): Redis {
    const url = system.getOrThrow(AppSystemProp.REDIS_URL)
    const client = new Redis(url, config)
    return client
}

function createStandaloneRedisConnection(config: Partial<RedisOptions>): Redis {
    const host = system.getOrThrow(AppSystemProp.REDIS_HOST)
    const serializedPort = system.getOrThrow(AppSystemProp.REDIS_PORT)
    const username = system.get(AppSystemProp.REDIS_USER)
    const password = system.get(AppSystemProp.REDIS_PASSWORD)
    const port = Number.parseInt(serializedPort, 10)
    const db = system.getNumber(AppSystemProp.REDIS_DB) ?? 0
    const useSsl = system.getBoolean(AppSystemProp.REDIS_USE_SSL) ?? false
    const sslCaFile = system.get(AppSystemProp.REDIS_SSL_CA_FILE)

    const client = new Redis({
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

    system.globalLogger().info('Created standalone Redis connection', {
        host,
        port,
        db,
        username: username ? '***' : undefined,
        ssl: useSsl,
    })

    return client
}


function readCAFile(file: string | undefined): string | undefined {
    if (isNil(file)) {
        return undefined
    }
    return fs.readFileSync(file, { encoding: 'utf8' })
}
