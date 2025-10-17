import { redisConnections } from '../database/redis-connections'


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

    async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
        const redisClient = await redisConnections.useExisting()
        const hashData = await redisClient.hgetall(key)
        if (!hashData || Object.keys(hashData).length === 0) return null
        return this.parseHashData<T>(hashData)
    },

    async hdelete(key: string): Promise<void> {
        const redisClient = await redisConnections.useExisting()
        await redisClient.del(key)
    },

    async merge<T extends Record<string, unknown>>(key: string, value: T, ttlInSeconds?: number): Promise<void> {
        const redisClient = await redisConnections.useExisting()
        const serializedFields: Record<string, string> = {}
        
        for (const [field, fieldValue] of Object.entries(value)) {
            serializedFields[field] = JSON.stringify(fieldValue)
        }
        
        await redisClient.hset(key, serializedFields)
        
        if (ttlInSeconds) {
            await redisClient.expire(key, ttlInSeconds)
        }
    },
    parseHashData: <T extends Record<string, unknown>>(hashData: Record<string, string>): T => {
        const result: Record<string, unknown> = {}
        for (const [field, value] of Object.entries(hashData)) {
            if (value && value.trim().length > 0) {
                try {
                    result[field] = JSON.parse(value)
                }
                catch {
                    result[field] = value
                }
            }
        }
        return result as T
    }
    
}
