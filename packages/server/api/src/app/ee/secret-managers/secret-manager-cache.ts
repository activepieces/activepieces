import { apDayjsDuration } from '@activepieces/server-common'
import NodeCache from 'node-cache'

const ONE_HOUR_SECONDS = apDayjsDuration(1, 'hour').asSeconds()

const cache = new NodeCache({ stdTTL: ONE_HOUR_SECONDS, useClones: false })

const buildConnectionCheckKey = (platformId: string, providerId: string) =>
    `${platformId}:check:${providerId}`

const buildSecretValueKey = (platformId: string, providerId: string, path: string) =>
    `${platformId}:secret:${providerId}:${path}`

export const secretManagerCache = {
    getConnectionStatus(platformId: string, providerId: string): boolean | undefined {
        return cache.get<boolean>(buildConnectionCheckKey(platformId, providerId))
    },
    setConnectionStatus(platformId: string, providerId: string, value: boolean): void {
        cache.set(buildConnectionCheckKey(platformId, providerId), value)
    },
    getSecretValue(platformId: string, providerId: string, path: string): string | undefined {
        return cache.get<string>(buildSecretValueKey(platformId, providerId, path))
    },
    setSecretValue(platformId: string, providerId: string, path: string, value: string): void {
        cache.set(buildSecretValueKey(platformId, providerId, path), value)
    },
    invalidatePlatformEntries(platformId: string): void {
        const prefix = `${platformId}:`
        const keys = cache.keys().filter(key => key.startsWith(prefix))
        cache.del(keys)
    },
}
