import fs from 'fs'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import Redis, { RedisOptions } from 'ioredis'
import { RedisConnectionSettings } from './types'


export async function createDefaultRedisConnection(settings: RedisConnectionSettings): Promise<Redis> {
    const config: Partial<RedisOptions> = {
        maxRetriesPerRequest: null,
    }

    const url = settings.REDIS_URL
    if (isNil(url)) {
        return createStandaloneRedisConnection(settings, config)
    }
    return createRedisConnectionUsingUrl(settings, config)
}

function createRedisConnectionUsingUrl(settings: RedisConnectionSettings, config: Partial<RedisOptions>): Redis {
    const url = settings.REDIS_URL
    assertNotNullOrUndefined(url, 'URL is required')
    const client = new Redis(url, config)
    return client
}

function createStandaloneRedisConnection(settings: RedisConnectionSettings, config: Partial<RedisOptions>): Redis {
    const host = settings.REDIS_HOST
    const serializedPort = settings.REDIS_PORT
    assertNotNullOrUndefined(host, 'Host is required')
    assertNotNullOrUndefined(serializedPort, 'Port is required')
    const username = settings.REDIS_USER
    const password = settings.REDIS_PASSWORD
    const port = Number.parseInt(serializedPort, 10)
    const db = settings.REDIS_DB ?? 0
    const useSsl = settings.REDIS_USE_SSL ?? false
    const sslCaFile = settings.REDIS_SSL_CA_FILE

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


    return client
}


function readCAFile(file: string | undefined): string | undefined {
    if (isNil(file)) {
        return undefined
    }
    return fs.readFileSync(file, { encoding: 'utf8' })
}
