import { AppSystemProp } from '@activepieces/server-shared'
import { QueueMode, RedisType, system } from '../../helper/system/system'
import { createDefaultRedisConnection } from './default-redis'
import { createMemoryRedisConnection } from './memory-redis'
import { createSentinelRedisConnection } from './sentinel-redis'
import Redis from 'ioredis'
import { Mutex } from 'async-mutex'
import { isNil } from '@activepieces/shared'

let redisConnectionInstance: Redis | null = null
let mutexLock = new Mutex()
function getRedisType(): RedisType {
    const checkIfUserHasDeprecatedQueueMode = system.getOrThrow<QueueMode>(AppSystemProp.QUEUE_MODE) === QueueMode.MEMORY
    if (checkIfUserHasDeprecatedQueueMode) {
        return RedisType.MEMORY
    }
    return system.getOrThrow<RedisType>(AppSystemProp.REDIS_TYPE)
}

export const redisConnections = {
    createNew: async (): Promise<Redis> => {
        const redisType = getRedisType()
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
    }

}