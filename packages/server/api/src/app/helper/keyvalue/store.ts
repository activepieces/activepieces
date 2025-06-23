export type KeyValueStore = {
    put(key: string, value: unknown, ttlInSeconds?: number): Promise<void>
    get<T>(key: string): Promise<T | null>
    delete(key: string): Promise<void>
} 