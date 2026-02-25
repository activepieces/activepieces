const ONE_HOUR_MS = 60 * 60 * 1000

type CacheEntry = { value: unknown, expiresAt: number }
const cache = new Map<string, CacheEntry>()

function get<T>(key: string): T | undefined {
    const entry = cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
        cache.delete(key); return undefined 
    }
    return entry.value as T
}

function set(key: string, value: unknown): void {
    cache.set(key, { value, expiresAt: Date.now() + ONE_HOUR_MS })
}

const checkKey = (platformId: string, providerId: string) =>
    `${platformId}:check:${providerId}`

const secretKey = (platformId: string, providerId: string, path: string) =>
    `${platformId}:secret:${providerId}:${path}`

export const secretManagerCache = {
    getCheck(platformId: string, providerId: string): boolean | undefined {
        return get<boolean>(checkKey(platformId, providerId))
    },
    setCheck(platformId: string, providerId: string, value: boolean): void {
        set(checkKey(platformId, providerId), value)
    },
    getSecret(platformId: string, providerId: string, path: string): string | undefined {
        return get<string>(secretKey(platformId, providerId, path))
    },
    setSecret(platformId: string, providerId: string, path: string, value: string): void {
        set(secretKey(platformId, providerId, path), value)
    },
    clearByPlatform(platformId: string): void {
        const prefix = `${platformId}:`
        for (const key of cache.keys()) {
            if (key.startsWith(prefix)) {
                cache.delete(key)
            }
        }
    },
}
