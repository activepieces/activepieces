import fs from 'fs'
import { AppSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import Redis, { RedisOptions } from 'ioredis'
import { system } from '../../helper/system/system'

export async function createSentinelRedisConnection(): Promise<Redis> {
    const sentinelList = system.getOrThrow(AppSystemProp.REDIS_SENTINEL_HOSTS)
    const sentinelName = system.getOrThrow(AppSystemProp.REDIS_SENTINEL_NAME)
    const sentinelRole = system.get<'master' | 'slave'>(AppSystemProp.REDIS_SENTINEL_ROLE)
    const username = system.get(AppSystemProp.REDIS_USER)
    const password = system.get(AppSystemProp.REDIS_PASSWORD)
    const useSsl = system.getBoolean(AppSystemProp.REDIS_USE_SSL) ?? false
    const sslCaFile = system.get(AppSystemProp.REDIS_SSL_CA_FILE)

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
