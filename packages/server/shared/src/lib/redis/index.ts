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
    return {
        getRedisType(): RedisType {
            return settings().REDIS_TYPE as RedisType
        },
        async create(): Promise<Redis> {
            const redisType = settings().REDIS_TYPE
            switch (redisType) {
                case RedisType.MEMORY:
                    return createMemoryRedisConnection()
                case RedisType.SENTINEL:
                    return createSentinelRedisConnection(settings())
                default:
                    return createDefaultRedisConnection(settings())
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
                redisConnectionInstance = await this.create()
                return redisConnectionInstance
            })
        },
    }
}

