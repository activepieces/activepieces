import { AppSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import Redis from 'ioredis'
import { QueueMode, RedisType, system } from '../../helper/system/system'
import { createDefaultRedisConnection } from './default-redis'
import { createMemoryRedisConnection } from './memory-redis'
import { createSentinelRedisConnection } from './sentinel-redis'

let redisConnectionInstance: Redis | null = null
const mutexLock = new Mutex()

export const redisConnections = {
    createNew: async (): Promise<Redis> => {
        const redisType = redisConnections.getRedisType()
        switch (redisType) {
            case RedisType.MEMORY:
                return createMemoryRedisConnection()
            case RedisType.SENTINEL:
                return createSentinelRedisConnection()
            default:
                return createDefaultRedisConnection()
        }
    },

    useExisting: async (): Promise<Redis> => {
        if (redisConnectionInstance) {
            return redisConnectionInstance
        }
        return mutexLock.runExclusive(async () => {
            if (!isNil(redisConnectionInstance)) {
                return redisConnectionInstance
            }
            redisConnectionInstance = await redisConnections.createNew()
            return redisConnectionInstance
        })
    },
    getRedisType: (): RedisType => {
        const checkIfUserHasDeprecatedQueueMode = system.getOrThrow<QueueMode>(AppSystemProp.QUEUE_MODE) === QueueMode.MEMORY
        if (checkIfUserHasDeprecatedQueueMode) {
            return RedisType.MEMORY
        }
        return system.getOrThrow<RedisType>(AppSystemProp.REDIS_TYPE)
    },

}