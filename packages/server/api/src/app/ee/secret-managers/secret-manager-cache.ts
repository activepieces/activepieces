import { apDayjsDuration } from '@activepieces/server-common'
import NodeCache from 'node-cache'

const ONE_HOUR_SECONDS = apDayjsDuration(1, 'hour').asSeconds()

const cache = new NodeCache({ stdTTL: ONE_HOUR_SECONDS, useClones: false })

const checkKey = (platformId: string, providerId: string) =>
    `${platformId}:check:${providerId}`

const secretKey = (platformId: string, providerId: string, path: string) =>
    `${platformId}:secret:${providerId}:${path}`

export const secretManagerCache = {
    getCheck(platformId: string, providerId: string): boolean | undefined {
        return cache.get<boolean>(checkKey(platformId, providerId))
    },
    setCheck(platformId: string, providerId: string, value: boolean): void {
        cache.set(checkKey(platformId, providerId), value)
    },
    getSecret(platformId: string, providerId: string, path: string): string | undefined {
        return cache.get<string>(secretKey(platformId, providerId, path))
    },
    setSecret(platformId: string, providerId: string, path: string, value: string): void {
        cache.set(secretKey(platformId, providerId, path), value)
    },
    clearByPlatform(platformId: string): void {
        const prefix = `${platformId}:`
        const keys = cache.keys().filter(k => k.startsWith(prefix))
        cache.del(keys)
    },
}
