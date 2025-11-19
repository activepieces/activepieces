import fs from 'fs'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import Redis, { RedisOptions } from 'ioredis'
import { RedisConnectionSettings } from './types'

export async function createSentinelRedisConnection(settings: RedisConnectionSettings): Promise<Redis> {
    const sentinelList = settings.REDIS_SENTINEL_HOSTS
    const sentinelName = settings.REDIS_SENTINEL_NAME
    const sentinelRole = settings.REDIS_SENTINEL_ROLE as 'master' | 'slave'
    const username = settings.REDIS_USER
    const password = settings.REDIS_PASSWORD
    const useSsl = settings.REDIS_USE_SSL ?? false
    const sslCaFile = settings.REDIS_SSL_CA_FILE

    assertNotNullOrUndefined(sentinelList, 'Sentinel list is required')
    assertNotNullOrUndefined(sentinelName, 'Sentinel name is required')


    const sentinels = sentinelList.split(',').map((sentinel) => {
        const [host, port] = sentinel.split(':')
        return { host, port: Number.parseInt(port, 10) }
    })

    const tlsCa = readCAFile(sslCaFile)
    
    const redisOptions: RedisOptions = {
        maxRetriesPerRequest: null,
        sentinels,
        name: sentinelName,
        username,
        password,
        role: sentinelRole,
        ...getTlsOptionsForSentinel(useSsl, tlsCa),
        lazyConnect: true,
    }

    const client = new Redis(redisOptions)
    return client
}

function getTlsOptionsForSentinel(useSsl: boolean, tlsCa: string | undefined): Partial<RedisOptions> {
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


function readCAFile(file: string | undefined): string | undefined {
    if (isNil(file)) {
        return undefined
    }
    return fs.readFileSync(file, { encoding: 'utf8' })
}
