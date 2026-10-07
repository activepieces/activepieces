import { isNil } from '@activepieces/core-utils'

export function createCacheVersionMemo<V>({ currentCacheVersion }: CreateCacheVersionMemoParams): CacheVersionMemo<V> {
    let cacheVersion: number | null = null
    let entries = new Map<string, Promise<V>>()
    return {
        get({ key, load }): Promise<V> {
            const requested = currentCacheVersion()
            if (requested !== cacheVersion) {
                cacheVersion = requested
                entries = new Map()
            }
            const existing = entries.get(key)
            if (!isNil(existing)) {
                return existing
            }
            const owner = entries
            const pending = load()
            owner.set(key, pending)
            pending.catch(() => {
                if (owner.get(key) === pending) {
                    owner.delete(key)
                }
            })
            return pending
        },
    }
}

type CreateCacheVersionMemoParams = {
    currentCacheVersion: () => number
}

export type CacheVersionMemo<V> = {
    get(params: { key: string, load: () => Promise<V> }): Promise<V>
}
