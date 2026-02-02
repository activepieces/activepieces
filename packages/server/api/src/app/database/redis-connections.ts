import {
    AppSystemProp,
    distributedLockFactory,
    distributedStoreFactory,
    redisConnectionFactory,
    RedisType,
} from '@activepieces/server-shared'
import { system } from '../helper/system/system'

export const redisConnections = redisConnectionFactory(() => {
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
})

export const distributedLock = distributedLockFactory(redisConnections.create)
export const distributedStore = distributedStoreFactory(redisConnections.useExisting)
