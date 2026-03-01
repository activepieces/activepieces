import { apDayjsDuration, redisHelper } from '@activepieces/server-common'
import { EncryptedObject, encryptUtils } from 'src/app/helper/encryption'
import { distributedStore, redisConnections } from '../../database/redis-connections'

const ONE_HOUR_SECONDS = apDayjsDuration(1, 'hour').asSeconds()

const KEY_PREFIX = 'secret-manager'

const buildConnectionCheckKey = (platformId: string, providerId: string) =>
    `${KEY_PREFIX}:${platformId}:check:${providerId}`

const buildSecretValueKey = (platformId: string, providerId: string, path: string) =>
    `${KEY_PREFIX}:${platformId}:secret:${providerId}:${path}`

export const secretManagerCache = {
    async getConnectionStatus(platformId: string, providerId: string): Promise<boolean | undefined> {
        const result = await distributedStore.get<boolean>(buildConnectionCheckKey(platformId, providerId))
        return result ?? undefined
    },
    async setConnectionStatus(platformId: string, providerId: string, value: boolean): Promise<void> {
        await distributedStore.put(buildConnectionCheckKey(platformId, providerId), value, ONE_HOUR_SECONDS)
    },
    async getSecretValue(platformId: string, providerId: string, path: string): Promise<string | undefined> {
        const result = await distributedStore.get<EncryptedObject>(buildSecretValueKey(platformId, providerId, path))
        return result ? encryptUtils.decryptString(result) : undefined
    },
    async setSecretValue(platformId: string, providerId: string, path: string, value: string): Promise<void> {
        const encryptedValue = await encryptUtils.encryptString(value)
        await distributedStore.put(buildSecretValueKey(platformId, providerId, path), encryptedValue, ONE_HOUR_SECONDS)
    },
    async invalidatePlatformEntries(platformId: string): Promise<void> {
        const redis = await redisConnections.useExisting()
        const keys = await redisHelper.scanAll(redis, `${KEY_PREFIX}:${platformId}:*`)
        if (keys.length > 0) {
            await redis.del(keys)
        }
    },
}
