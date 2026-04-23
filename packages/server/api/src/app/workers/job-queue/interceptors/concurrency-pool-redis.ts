import { getConcurrencyPoolSetKey, getConcurrencyPoolWaitlistKey } from '../../../database/redis/keys'
import { redisConnections } from '../../../database/redis-connections'

export const concurrencyPoolRedis = {
    async acquireSlotOrEnqueue({ poolId, member, maxJobs, timeoutMs }: AcquireParams): Promise<AcquireOutcome> {
        const redis = await redisConnections.useExisting()
        const result = await redis.eval(
            ACQUIRE_OR_ENQUEUE_LUA,
            2,
            getConcurrencyPoolSetKey(poolId),
            getConcurrencyPoolWaitlistKey(poolId),
            Date.now().toString(),
            timeoutMs.toString(),
            maxJobs.toString(),
            member,
        ) as string
        return result === 'acquired' ? 'acquired' : 'queued'
    },

    async releaseSlotAndPopWaiter({ poolId, member, timeoutMs }: ReleaseParams): Promise<string | null> {
        const redis = await redisConnections.useExisting()
        const result = await redis.eval(
            RELEASE_AND_POP_LUA,
            2,
            getConcurrencyPoolSetKey(poolId),
            getConcurrencyPoolWaitlistKey(poolId),
            Date.now().toString(),
            timeoutMs.toString(),
            member,
        ) as string
        return result === '' ? null : result
    },

    async rollbackPromotion({ poolId, member, timeoutMs }: ReleaseParams): Promise<void> {
        const redis = await redisConnections.useExisting()
        await redis.eval(
            ROLLBACK_PROMOTION_LUA,
            2,
            getConcurrencyPoolSetKey(poolId),
            getConcurrencyPoolWaitlistKey(poolId),
            timeoutMs.toString(),
            member,
        )
    },

    async dropPromotedMember({ poolId, member }: { poolId: string, member: string }): Promise<void> {
        const redis = await redisConnections.useExisting()
        await redis.zrem(getConcurrencyPoolSetKey(poolId), member)
    },

    buildMember({ projectId, jobId }: { projectId: string, jobId: string }): string {
        return `${projectId}:${jobId}`
    },

    parseMember(member: string): { projectId: string, jobId: string } | null {
        const idx = member.indexOf(':')
        if (idx === -1) return null
        return {
            projectId: member.slice(0, idx),
            jobId: member.slice(idx + 1),
        }
    },
}

const ACQUIRE_OR_ENQUEUE_LUA = `
local activeKey = KEYS[1]
local waitlistKey = KEYS[2]
local currentTime = tonumber(ARGV[1])
local timeoutMs = tonumber(ARGV[2])
local maxJobs = tonumber(ARGV[3])
local member = ARGV[4]
local ttlSeconds = math.ceil(timeoutMs / 1000)

redis.call('ZREMRANGEBYSCORE', activeKey, '-inf', currentTime - timeoutMs)

if redis.call('ZSCORE', activeKey, member) then
    return 'acquired'
end

if redis.call('ZCARD', activeKey) >= maxJobs or redis.call('LLEN', waitlistKey) > 0 then
    redis.call('RPUSH', waitlistKey, member)
    redis.call('EXPIRE', waitlistKey, ttlSeconds)
    return 'queued'
end

redis.call('ZADD', activeKey, currentTime, member)
redis.call('EXPIRE', activeKey, ttlSeconds)
return 'acquired'
`

const RELEASE_AND_POP_LUA = `
local activeKey = KEYS[1]
local waitlistKey = KEYS[2]
local currentTime = tonumber(ARGV[1])
local timeoutMs = tonumber(ARGV[2])
local member = ARGV[3]
local ttlSeconds = math.ceil(timeoutMs / 1000)

redis.call('ZREM', activeKey, member)

local nextMember = redis.call('LPOP', waitlistKey)
if not nextMember then
    return ''
end

redis.call('ZADD', activeKey, currentTime, nextMember)
redis.call('EXPIRE', activeKey, ttlSeconds)
return nextMember
`

const ROLLBACK_PROMOTION_LUA = `
local activeKey = KEYS[1]
local waitlistKey = KEYS[2]
local timeoutMs = tonumber(ARGV[1])
local member = ARGV[2]
local ttlSeconds = math.ceil(timeoutMs / 1000)

redis.call('ZREM', activeKey, member)
redis.call('LPUSH', waitlistKey, member)
redis.call('EXPIRE', waitlistKey, ttlSeconds)
return 1
`

export type AcquireOutcome = 'acquired' | 'queued'

type AcquireParams = {
    poolId: string
    member: string
    maxJobs: number
    timeoutMs: number
}

type ReleaseParams = {
    poolId: string
    member: string
    timeoutMs: number
}
