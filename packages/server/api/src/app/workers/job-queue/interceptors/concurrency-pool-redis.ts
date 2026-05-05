import { isNil } from '@activepieces/shared'
import { getConcurrencyPoolSetKey, getConcurrencyPoolWaitlistKey } from '../../../database/redis/keys'
import { redisConnections } from '../../../database/redis-connections'

export const concurrencyPoolRedis = {
    async acquireSlotOrEnqueue({ poolId, projectId, jobId, maxJobs, timeoutMs }: AcquireParams): Promise<AcquireResult> {
        const redis = await redisConnections.useExisting()
        const result = await redis.eval(
            ACQUIRE_OR_ENQUEUE_LUA,
            2,
            getConcurrencyPoolSetKey(poolId),
            getConcurrencyPoolWaitlistKey(poolId),
            Date.now().toString(),
            timeoutMs.toString(),
            maxJobs.toString(),
            encodeMember({ projectId, jobId }),
        ) as [string, string[]]
        return {
            outcome: result[0] === 'acquired' ? 'acquired' : 'queued',
            promoted: await collectValidPromotions({ poolId, raw: result[1] ?? [] }),
        }
    },

    async releaseSlotAndPopWaiter({ poolId, projectId, jobId, timeoutMs }: ReleaseParams): Promise<WaiterIdentity | null> {
        const redis = await redisConnections.useExisting()
        const result = await redis.eval(
            RELEASE_AND_POP_LUA,
            2,
            getConcurrencyPoolSetKey(poolId),
            getConcurrencyPoolWaitlistKey(poolId),
            Date.now().toString(),
            timeoutMs.toString(),
            encodeMember({ projectId, jobId }),
        ) as string
        if (result === '') {
            return null
        }
        const promotions = await collectValidPromotions({ poolId, raw: [result] })
        return promotions[0] ?? null
    },

    async dropPromotedWaiter({ poolId, waiter }: DropParams): Promise<void> {
        const redis = await redisConnections.useExisting()
        await redis.zrem(getConcurrencyPoolSetKey(poolId), encodeMember(waiter))
    },
}

async function collectValidPromotions({ poolId, raw }: { poolId: string, raw: string[] }): Promise<WaiterIdentity[]> {
    const valid: WaiterIdentity[] = []
    const invalid: string[] = []
    for (const member of raw) {
        const parsed = decodeMember(member)
        if (isNil(parsed)) {
            invalid.push(member)
            continue
        }
        valid.push(parsed)
    }
    if (invalid.length > 0) {
        const redis = await redisConnections.useExisting()
        await redis.zrem(getConcurrencyPoolSetKey(poolId), ...invalid)
    }
    return valid
}

function encodeMember({ projectId, jobId }: WaiterIdentity): string {
    return `${projectId}:${jobId}`
}

function decodeMember(member: string): WaiterIdentity | null {
    const idx = member.indexOf(':')
    if (idx === -1) return null
    return {
        projectId: member.slice(0, idx),
        jobId: member.slice(idx + 1),
    }
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
    return {'acquired', {}}
end

if redis.call('ZSCORE', waitlistKey, member) then
    return {'queued', {}}
end

local promoted = {}
while redis.call('ZCARD', activeKey) < maxJobs do
    local head = redis.call('ZPOPMIN', waitlistKey)
    if #head == 0 then break end
    redis.call('ZADD', activeKey, currentTime, head[1])
    table.insert(promoted, head[1])
end

if redis.call('ZCARD', activeKey) < maxJobs then
    redis.call('ZADD', activeKey, currentTime, member)
    redis.call('EXPIRE', activeKey, ttlSeconds)
    if redis.call('ZCARD', waitlistKey) > 0 then
        redis.call('EXPIRE', waitlistKey, ttlSeconds)
    end
    return {'acquired', promoted}
end

local nextScore = currentTime
local last = redis.call('ZRANGE', waitlistKey, -1, -1, 'WITHSCORES')
if #last == 2 then
    local prev = tonumber(last[2])
    if prev >= nextScore then nextScore = prev + 1 end
end
redis.call('ZADD', waitlistKey, nextScore, member)
redis.call('EXPIRE', activeKey, ttlSeconds)
redis.call('EXPIRE', waitlistKey, ttlSeconds)
return {'queued', promoted}
`

const RELEASE_AND_POP_LUA = `
local activeKey = KEYS[1]
local waitlistKey = KEYS[2]
local currentTime = tonumber(ARGV[1])
local timeoutMs = tonumber(ARGV[2])
local member = ARGV[3]
local ttlSeconds = math.ceil(timeoutMs / 1000)

redis.call('ZREM', activeKey, member)

local head = redis.call('ZPOPMIN', waitlistKey)
if #head == 0 then
    return ''
end

redis.call('ZADD', activeKey, currentTime, head[1])
redis.call('EXPIRE', activeKey, ttlSeconds)
if redis.call('ZCARD', waitlistKey) > 0 then
    redis.call('EXPIRE', waitlistKey, ttlSeconds)
end
return head[1]
`

export type AcquireOutcome = 'acquired' | 'queued'

export type WaiterIdentity = {
    projectId: string
    jobId: string
}

export type AcquireResult = {
    outcome: AcquireOutcome
    promoted: WaiterIdentity[]
}

type AcquireParams = WaiterIdentity & {
    poolId: string
    maxJobs: number
    timeoutMs: number
}

type ReleaseParams = WaiterIdentity & {
    poolId: string
    timeoutMs: number
}

type DropParams = {
    poolId: string
    waiter: WaiterIdentity
}
