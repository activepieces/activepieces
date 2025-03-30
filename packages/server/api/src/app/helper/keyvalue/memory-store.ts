import { KeyValueStore } from './store'

const store = new Map<string, { value: unknown, expireAt?: number }>()

export const memoryStore: KeyValueStore = {

    async put(key: string, value: unknown, ttlInSeconds?: number): Promise<void> {
        const expireAt = ttlInSeconds ? Date.now() + ttlInSeconds * 1000 : undefined
        store.set(key, { value, expireAt })
        if (ttlInSeconds) {
            setTimeout(async () => {
                await memoryStore.delete(key)
            }, ttlInSeconds * 1000)
        }
    },

    async get<T>(key: string): Promise<T | null> {
        const item = store.get(key)
        if (!item) return null

        if (item.expireAt && item.expireAt <= Date.now()) {
            store.delete(key)
            return null
        }

        return item.value as T
    },

    async delete(key: string): Promise<void> {
        store.delete(key)
    },
}
