import { redisConnections } from '../../database/redis-connections'

const CACHE_ID_PREFIX = 'workerCacheId:'
const CACHE_ID_TTL_SECONDS = 120

const ALLOCATE_CACHE_ID_SCRIPT = `
    local prefix = ARGV[1]
    local ttl = tonumber(ARGV[2])
    local cursor = "0"
    local used = {}
    repeat
        local result = redis.call('SCAN', cursor, 'MATCH', prefix .. '*', 'COUNT', 100)
        cursor = result[1]
        for _, key in ipairs(result[2]) do
            local id = tonumber(string.sub(key, #prefix + 1))
            if id then used[id] = true end
        end
    until cursor == "0"
    local id = 0
    while used[id] do
        id = id + 1
    end
    redis.call('SET', prefix .. id, '1', 'EX', ttl)
    return id
`

export const workerIdGenerator = {
    async allocate(): Promise<number> {
        const redis = await redisConnections.useExisting()
        const id = await redis.eval(ALLOCATE_CACHE_ID_SCRIPT, 0, CACHE_ID_PREFIX, CACHE_ID_TTL_SECONDS)
        return id as number
    },

    async renew(cacheId: number): Promise<void> {
        const redis = await redisConnections.useExisting()
        await redis.expire(`${CACHE_ID_PREFIX}${cacheId}`, CACHE_ID_TTL_SECONDS)
    },

    async release(cacheId: number): Promise<void> {
        const redis = await redisConnections.useExisting()
        await redis.del(`${CACHE_ID_PREFIX}${cacheId}`)
    },
}
