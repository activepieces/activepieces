import { AppSystemProp, QueueMode, redisConnectionFactory, RedisConnectionSettings, RedisType } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import Redis from 'ioredis'
import { system } from '../helper/system/system'
let redisConnectionInstance: Redis | null = null
const mutexLock = new Mutex()

export const redisConnections = {
    createNew: async (): Promise<Redis> => {
        const redisConnectionSettings: RedisConnectionSettings = {
            REDIS_TYPE: redisConnections.getRedisType(),
            REDIS_SSL_CA_FILE: system.get(AppSystemProp.REDIS_SSL_CA_FILE),
            REDIS_DB: system.getNumber(AppSystemProp.REDIS_DB) ?? undefined, 
            REDIS_HOST: system.getOrThrow(AppSystemProp.REDIS_HOST),
            REDIS_PASSWORD: system.get(AppSystemProp.REDIS_PASSWORD),
            REDIS_PORT: system.getOrThrow(AppSystemProp.REDIS_PORT),
            REDIS_URL: system.getOrThrow(AppSystemProp.REDIS_URL),
            REDIS_USER: system.getOrThrow(AppSystemProp.REDIS_USER),
            REDIS_USE_SSL: system.get(AppSystemProp.REDIS_USE_SSL) === 'true',
            REDIS_SENTINEL_ROLE: system.get(AppSystemProp.REDIS_SENTINEL_ROLE),
            REDIS_SENTINEL_HOSTS: system.get(AppSystemProp.REDIS_SENTINEL_HOSTS),
            REDIS_SENTINEL_NAME: system.get(AppSystemProp.REDIS_SENTINEL_NAME),
        }
        return redisConnectionFactory.create(redisConnectionSettings)
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