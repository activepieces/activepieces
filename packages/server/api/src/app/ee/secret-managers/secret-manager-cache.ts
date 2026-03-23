import { apDayjsDuration } from '@activepieces/server-utils'
import { redisHelper } from '../../database/redis'
import { distributedStore, redisConnections } from '../../database/redis-connections'
import { EncryptedObject, encryptUtils } from '../../helper/encryption'

const ONE_HOUR_SECONDS = apDayjsDuration(1, 'hour').asSeconds()

const KEY_PREFIX = 'secret-manager'

const buildConnectionCheckKey = ({ platformId, connectionId }: { platformId: string, connectionId: string }) =>
    `${KEY_PREFIX}:check:${platformId}:${connectionId}`

const buildSecretValueKey = ({ platformId, connectionId, path }: { platformId: string, connectionId: string, path: string }) =>
    `${KEY_PREFIX}:secret:${platformId}:${connectionId}:${path}`

export const secretManagerCache = {
    async getConnectionStatus({ platformId, connectionId }: { platformId: string, connectionId: string }): Promise<boolean | undefined> {
        const result = await distributedStore.get<boolean>(buildConnectionCheckKey({ platformId, connectionId }))
        return result ?? undefined
    },
    async setConnectionStatus({ platformId, connectionId, value }: { platformId: string, connectionId: string, value: boolean }): Promise<void> {
        await distributedStore.put(buildConnectionCheckKey({ platformId, connectionId }), value, ONE_HOUR_SECONDS)
    },
    async getSecretValue({ platformId, connectionId, path }: { platformId: string, connectionId: string, path: string }): Promise<string | undefined> {
        const result = await distributedStore.get<EncryptedObject>(buildSecretValueKey({ platformId, connectionId, path }))
        return result ? encryptUtils.decryptString(result) : undefined
    },
    async setSecretValue({ platformId, connectionId, path, value }: { platformId: string, connectionId: string, path: string, value: string }): Promise<void> {
        const encryptedValue = await encryptUtils.encryptString(value)
        await distributedStore.put(buildSecretValueKey({ platformId, connectionId, path }), encryptedValue, ONE_HOUR_SECONDS)
    },
    async invalidateConnectionEntries({ platformId, connectionId }: { platformId: string, connectionId?: string }): Promise<void> {
        const redis = await redisConnections.useExisting()
        const pattern = connectionId
            ? `${KEY_PREFIX}:*:${platformId}:${connectionId}*`
            : `${KEY_PREFIX}:*:${platformId}:*`
        const keys = await redisHelper.scanAll(redis, pattern)
        if (keys.length > 0) {
            await redis.del(keys)
        }
    },
}
