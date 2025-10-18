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

    async hgetJson<T extends Record<string, unknown>>(key: string): Promise<T | null> {
        const redisClient = await redisConnections.useExisting()
        const hashData = await redisClient.hgetall(key)
        if (!hashData || Object.keys(hashData).length === 0) return null
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
    },

    async hdeleteFieldsIfValueMatches(
        key: string,
        fieldValuePairs: [string, unknown][],
    ): Promise<void> {
        const redisClient = await redisConnections.useExisting()
        const lua = `
            for i = 1, #ARGV, 2 do
                if redis.call('HGET', KEYS[1], ARGV[i]) == ARGV[i+1] then
                    redis.call('HDEL', KEYS[1], ARGV[i])
                end
            end
            return
        `
        const flattenedArgs = fieldValuePairs.flatMap(([field, value]) => [field, JSON.stringify(value)])
        await redisClient.eval(lua, 1, key, ...flattenedArgs)
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

}
