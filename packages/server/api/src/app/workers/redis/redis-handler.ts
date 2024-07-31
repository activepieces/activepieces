import { getRedisConnection } from '../../database/redis-connection'

let redis = getRedisConnection() 

export const redisHandler = {
    async init(): Promise<void> {
        redis = getRedisConnection()
    },

    async push(userId: string, jobId: string): Promise<void> {
        const userKey = `active_runs:${userId}`
        await redis.sadd(userId, jobId)
        await redis.incr(userKey)
    },

    async poll(userId: string): Promise<string | null> {
        const userKey = `active_runs:${userId}`
        if ((await redis.scard(userKey)) === 0) {
            return null
        }
        const jobId = await redis.spop(userKey)
        await redis.decr(userKey)
        return jobId
    },

    async shouldBeLimited(userId: string): Promise<boolean> {
        const userKey = `active_runs:${userId}`
        const limit = 100 //TODO: The limit can be configurable
        const activeRuns = await redis.get(userKey)
        return parseInt(activeRuns || '0') > limit
    },

}
