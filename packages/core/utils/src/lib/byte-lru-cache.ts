import { isNil } from './utils'

export function createByteLruCache<T>({ budgetBytes }: CreateByteLruCacheParams): ByteLruCache<T> {
    const entries = new Map<string, ByteLruCacheEntry<T>>()
    let totalBytes = 0
    return {
        get: (key) => {
            const entry = entries.get(key)
            if (isNil(entry)) {
                return undefined
            }
            entries.delete(key)
            entries.set(key, entry)
            return entry.value
        },
        set: ({ key, value, sizeBytes }) => {
            const existing = entries.get(key)
            if (!isNil(existing)) {
                entries.delete(key)
                totalBytes -= existing.sizeBytes
            }
            if (sizeBytes > budgetBytes) {
                return
            }
            entries.set(key, { value, sizeBytes })
            totalBytes += sizeBytes
            for (const [oldestKey, oldest] of entries) {
                if (totalBytes <= budgetBytes) {
                    break
                }
                entries.delete(oldestKey)
                totalBytes -= oldest.sizeBytes
            }
        },
    }
}

type ByteLruCacheEntry<T> = {
    value: T
    sizeBytes: number
}

export type ByteLruCache<T> = {
    get(key: string): T | undefined
    set(params: { key: string, value: T, sizeBytes: number }): void
}

export type CreateByteLruCacheParams = {
    budgetBytes: number
}
