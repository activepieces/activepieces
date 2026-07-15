import { WorkerJobType } from '@activepieces/shared'
import { getChatConcurrencySetKey } from '../../../database/redis/keys'
import { redisConnections } from '../../../database/redis-connections'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'

// Caps fleet-wide in-flight chat turns (Redis-backed) so turns parked on approval gates can't occupy
// every worker slot and starve flow execution. Disabled by default (limit 0); Cloud/self-host opt in.
const STALE_MEMBER_TIMEOUT_MS = 25 * 60 * 1_000
const REJECT_BASE_DELAY_MS = 20_000
const REJECT_MAX_DELAY_MS = 600_000

function chatLimit(): number {
    return system.getNumber(AppSystemProp.CHAT_CONCURRENCY_LIMIT) ?? 0
}

async function tryAcquireSlot({ jobId, limit }: { jobId: string, limit: number }): Promise<boolean> {
    const redisConnection = await redisConnections.useExisting()
    const result = await redisConnection.eval(
        `
local setKey = KEYS[1]
local currentTime = tonumber(ARGV[1])
local timeoutMs = tonumber(ARGV[2])
local maxJobs = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', setKey, '-inf', currentTime - timeoutMs)

if redis.call('ZSCORE', setKey, member) then
    return 0
end
if redis.call('ZCARD', setKey) >= maxJobs then
    return 1
end

redis.call('ZADD', setKey, currentTime, member)
redis.call('EXPIRE', setKey, math.ceil(timeoutMs / 1000))
return 0
`,
        1,
        getChatConcurrencySetKey(),
        Date.now().toString(),
        STALE_MEMBER_TIMEOUT_MS.toString(),
        limit.toString(),
        jobId,
    ) as number
    return result === 0
}

export const chatConcurrencyInterceptor: JobInterceptor = {
    async preDispatch({ jobId, jobData, job, log }): Promise<InterceptorResult> {
        if (jobData.jobType !== WorkerJobType.EXECUTE_CHAT_AGENT) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        const limit = chatLimit()
        if (limit <= 0) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        if (await tryAcquireSlot({ jobId, limit })) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        const delayInMs = Math.min(REJECT_MAX_DELAY_MS, REJECT_BASE_DELAY_MS * Math.pow(2, job.attemptsMade))
        log.info({ job: { id: jobId }, limit, delayInMs }, '[chatConcurrencyInterceptor] Chat turn deferred — concurrency budget full')
        return { verdict: InterceptorVerdict.REJECT, delayInMs }
    },

    async onJobFinished({ jobId, jobData }): Promise<void> {
        if (jobData.jobType !== WorkerJobType.EXECUTE_CHAT_AGENT || chatLimit() <= 0) {
            return
        }
        const redisConnection = await redisConnections.useExisting()
        await redisConnection.zrem(getChatConcurrencySetKey(), jobId)
    },
}
