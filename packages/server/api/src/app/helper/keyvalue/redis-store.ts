import { Redis } from 'ioredis'
import { KeyValueStore } from './store'

export const createRedisStore = (redisClient: Redis): KeyValueStore => ({
    async put(key: string, value: unknown, ttlInSeconds?: number): Promise<void> {
        const serializedValue = JSON.stringify(value)
        if (ttlInSeconds) {
            await redisClient.setex(key, ttlInSeconds, serializedValue)
        }
        else {
            await redisClient.set(key, serializedValue)
        }
    },

    async get<T>(key: string): Promise<T | null> {
        const value = await redisClient.get(key)
        if (!value) return null
        return JSON.parse(value) as T
    },

    async delete(key: string): Promise<void> {
        await redisClient.del(key)
    },
})