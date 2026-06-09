import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import Redis from 'ioredis'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { createDefaultRedisConnection } from './default-redis'
import { createMemoryRedisConnection } from './memory-redis'
import { createSentinelRedisConnection } from './sentinel-redis'
import { RedisConnectionSettings, RedisType } from './types'

let redisConnectionInstance: Redis | null = null
const mutexLock = new Mutex()

function getSettings(): RedisConnectionSettings {
    return {
        REDIS_TYPE: system.getOrThrow<RedisType>(AppSystemProp.REDIS_TYPE),
        REDIS_SSL_CA_FILE: system.get(AppSystemProp.REDIS_SSL_CA_FILE),
        REDIS_DB: system.getNumber(AppSystemProp.REDIS_DB) ?? undefined,
        REDIS_HOST: system.get(AppSystemProp.REDIS_HOST),
        REDIS_PASSWORD: system.get(AppSystemProp.REDIS_PASSWORD),
        REDIS_PORT: system.get(AppSystemProp.REDIS_PORT),
        REDIS_URL: system.get(AppSystemProp.REDIS_URL),
        REDIS_USER: system.get(AppSystemProp.REDIS_USER),
        REDIS_USE_SSL: system.get(AppSystemProp.REDIS_USE_SSL) === 'true',
        REDIS_SENTINEL_ROLE: system.get(AppSystemProp.REDIS_SENTINEL_ROLE),
        REDIS_SENTINEL_HOSTS: system.get(AppSystemProp.REDIS_SENTINEL_HOSTS),
        REDIS_SENTINEL_NAME: system.get(AppSystemProp.REDIS_SENTINEL_NAME),
    }
}

export const redisConnections = {
    getRedisType(): RedisType {
        return getSettings().REDIS_TYPE as RedisType
    },
    async create(): Promise<Redis> {
        const settings = getSettings()
        switch (settings.REDIS_TYPE) {
            case RedisType.MEMORY:
                return createMemoryRedisConnection()
            case RedisType.SENTINEL:
                return createSentinelRedisConnection(settings)
            default:
                return createDefaultRedisConnection(settings)
        }
    },
    async useExisting(): Promise<Redis> {
        if (redisConnectionInstance) {
            return redisConnectionInstance
        }
        return mutexLock.runExclusive(async () => {
            if (!isNil(redisConnectionInstance)) {
                return redisConnectionInstance
            }
            redisConnectionInstance = await redisConnections.create()
            return redisConnectionInstance
        })
    },
    async destroy(): Promise<void> {
        if (redisConnectionInstance) {
            await redisConnectionInstance.quit()
            redisConnectionInstance = null
        }
    },
}

export const redisHelper = {
    scanAll: async (redis: Redis, match: string): Promise<string[]> => {
        const keys: string[] = []
        let cursor = '0'
        do {
            const [newCursor, foundKeys] = await redis.scan(cursor, 'MATCH', match, 'COUNT', 1000)
            cursor = newCursor
            keys.push(...foundKeys)
        } while (cursor !== '0')
        return keys
    },
}
