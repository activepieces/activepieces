import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import Redis from 'ioredis'
import { createDefaultRedisConnection } from './default-redis'
import { createMemoryRedisConnection } from './memory-redis'
import { createSentinelRedisConnection } from './sentinel-redis'
import { RedisConnectionSettings, RedisType } from './types'

let redisConnectionInstance: Redis | null = null
const mutexLock = new Mutex()

export function redisConnectionFactory(
    settings: () => RedisConnectionSettings,
) {
    const factory = {
        getRedisType(): RedisType {
            return settings().REDIS_TYPE as RedisType
        },
        async create(): Promise<Redis> {
            let redisConnection: Redis
            const redisType = settings().REDIS_TYPE
            switch (redisType) {
                case RedisType.MEMORY:
                    redisConnection = await createMemoryRedisConnection()
                    break
                case RedisType.SENTINEL:
                    redisConnection = await createSentinelRedisConnection(settings())
                    break
                default:
                    redisConnection = await createDefaultRedisConnection(settings())
                    break
            }
            return redisConnection
        },
        async useExisting(): Promise<Redis> {
            if (redisConnectionInstance) {
                return redisConnectionInstance
            }
            return mutexLock.runExclusive(async () => {
                if (!isNil(redisConnectionInstance)) {
                    return redisConnectionInstance
                }
                redisConnectionInstance = await factory.create()
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
    return factory
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
