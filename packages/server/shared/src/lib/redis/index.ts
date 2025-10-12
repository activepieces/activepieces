import Redis from 'ioredis'
import { createDefaultRedisConnection } from './default-redis'
import { createMemoryRedisConnection } from './memory-redis'
import { createSentinelRedisConnection } from './sentinel-redis'
import { RedisConnectionSettings, RedisType } from './types'


export const redisConnectionFactory = {
    create: async (settings: RedisConnectionSettings): Promise<Redis> => {
        const redisType = settings.REDIS_TYPE
        switch (redisType) {
            case RedisType.MEMORY:
                return createMemoryRedisConnection()
            case RedisType.SENTINEL:
                return createSentinelRedisConnection(settings)
            default:
                return createDefaultRedisConnection(settings)
        }
    },
}
