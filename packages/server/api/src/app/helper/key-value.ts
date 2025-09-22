import { redisConnections } from '../database/redis'

export const distributedStore = {
    async put(key: string, value: unknown, ttlInSeconds?: number): Promise<void> {
        const serializedValue = JSON.stringify(value)
        const redisClient = await redisConnections.useExisting()
        if (ttlInSeconds) {
            await redisClient.setex(key, ttlInSeconds, serializedValue)
        }
        else {
            await redisClient.set(key, serializedValue)
        }
    },

    async get<T>(key: string): Promise<T | null> {
        const redisClient = await redisConnections.useExisting()
        const value = await redisClient.get(key)
        if (!value) return null
        return JSON.parse(value) as T
    },

    async delete(key: string): Promise<void> {
        const redisClient = await redisConnections.useExisting()
        await redisClient.del(key)
    },
}
