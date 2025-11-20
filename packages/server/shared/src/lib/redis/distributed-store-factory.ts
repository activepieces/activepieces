import { isNil } from '@activepieces/shared'
import Redis from 'ioredis'

export const distributedStoreFactory = (getRedisClient: () => Promise<Redis>) => ({
    async put(key: string, value: unknown, ttlInSeconds?: number): Promise<void> {
        const serializedValue = JSON.stringify(value)
        const redisClient = await getRedisClient()
        if (ttlInSeconds) {
            await redisClient.setex(key, ttlInSeconds, serializedValue)
        }
        else {
            await redisClient.set(key, serializedValue)
        }
    },

    async get<T>(key: string): Promise<T | null> {
        const redisClient = await getRedisClient()
        const value = await redisClient.get(key)
        if (!value) return null

        return JSON.parse(value) as T
    },

    async getAll<T>(keys: string[]): Promise<Record<string, T | null>> {
        const redisClient = await getRedisClient()
        const values = await redisClient.mget(keys)
        return values.reduce<Record<string, T | null>>((result, value, index) => {
            if (value) {
                result[keys[index]] = JSON.parse(value)
            }
            return result
        }, {})
    },

    async delete(key: string): Promise<void> {
        const redisClient = await getRedisClient()
        await redisClient.del(key)
    },

    async putBoolean(key: string, value: boolean): Promise<void> {
        const redisClient = await getRedisClient()
        await redisClient.set(key, value ? '1' : '0')
    },

    async getBoolean(key: string): Promise<boolean | null> {
        const redisClient = await getRedisClient()
        const value = await redisClient.get(key)
        if (isNil(value)) return null
        return value === '1'
    },

    async putBooleanBatch(keyValuePairs: Array<{ key: string, value: boolean }>): Promise<void> {
        if (keyValuePairs.length === 0) return

        const redisClient = await getRedisClient()
        const multi = redisClient.multi()

        for (const { key, value } of keyValuePairs) {
            multi.set(key, value ? '1' : '0')
        }

        await multi.exec()
    },

    async hgetJson<T extends Record<string, unknown>>(key: string): Promise<T | null> {
        const redisClient = await getRedisClient()
        const hashData = await redisClient.hgetall(key)
        if (!hashData || Object.keys(hashData).length === 0) return null
        const result: Record<string, unknown> = {}
        for (const [field, value] of Object.entries(hashData)) {
            const hasValue = !isNil(value) && value.trim().length > 0
            if (!hasValue) {
                continue
            }
            try {
                result[field] = JSON.parse(value)
            }
            catch (error) {
                result[field] = value
            }
        }
        return result as T
    },

    async merge<T extends Record<string, unknown>>(key: string, value: T, ttlInSeconds?: number): Promise<void> {
        const redisClient = await getRedisClient()
        const serializedFields: Record<string, string> = {}

        for (const [field, fieldValue] of Object.entries(value)) {
            if (isNil(fieldValue)) {
                continue
            }
            serializedFields[field] = JSON.stringify(fieldValue)
        }

        await redisClient.hset(key, serializedFields)

        if (ttlInSeconds) {
            await redisClient.expire(key, ttlInSeconds)
        }
    },

    async deleteKeyIfFieldValueMatches(key: string, field: string, expectedValue: unknown): Promise<void> {
        const redisClient = await getRedisClient()
        const lua = `
            local currentValue = redis.call('HGET', KEYS[1], ARGV[1])
            if currentValue and currentValue == ARGV[2] then
                redis.call('DEL', KEYS[1])
            end
        `
        const serializedValue = JSON.stringify(expectedValue)
        await redisClient.eval(lua, 1, key, field, serializedValue)
    },
})

export type DistributedStore = ReturnType<typeof distributedStoreFactory>
