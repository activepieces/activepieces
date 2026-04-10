import { apDayjsDuration } from '@activepieces/server-utils'
import { ApEdition, ExecuteFlowJobData, isNil, JOB_PRIORITY, JobData, PlanName, PlatformId, RATE_LIMIT_PRIORITY, RunEnvironment, tryCatch, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getConcurrencyPoolSetKey, getPlatformPlanNameKey } from '../../../database/redis/keys'
import { distributedStore, redisConnections } from '../../../database/redis-connections'
import { concurrencyPoolService } from '../../../ee/platform/platform-plan/concurrency-pool.service'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'

const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]

const PLAN_CONCURRENT_JOBS_LIMITS: Record<string, number> = {
    [PlanName.STANDARD]: 5,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER1]: 5,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER2]: 5,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER3]: 10,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER4]: 15,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER5]: 20,
    [PlanName.APPSUMO_ACTIVEPIECES_TIER6]: 25,
    [PlanName.ENTERPRISE]: 30,
}

function shouldContinue(jobData: JobData): jobData is ExecuteFlowJobData {
    if (!system.getBoolean(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED)) {
        return false
    }
    if (!RATE_LIMIT_WORKER_JOB_TYPES.includes(jobData.jobType)) {
        return false
    }
    const castedJob = jobData as ExecuteFlowJobData
    if (castedJob.environment === RunEnvironment.TESTING) {
        return false
    }
    return true
}


async function getMaxConcurrentJobsForPlatformPlan({ platformId }: { platformId: PlatformId }): Promise<number> {
    if (system.getEdition() !== ApEdition.CLOUD) {
        return system.getNumberOrThrow(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT)
    }
    const platformPlanName = await distributedStore.get<string>(getPlatformPlanNameKey(platformId))
    if (!isNil(platformPlanName)) {
        const limit = PLAN_CONCURRENT_JOBS_LIMITS[platformPlanName]
        if (!isNil(limit)) return limit
    }
    return system.getNumberOrThrow(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT)
}

async function getMaxConcurrentJobs({ poolId, platformId, log }: { poolId: string | null, platformId: PlatformId, log: FastifyBaseLogger }): Promise<number> {
    if (!isNil(poolId)) {
        const { data: value, error } = await tryCatch(() => concurrencyPoolService(log).getPoolLimit(poolId))
        if (error === null && !isNil(value)) {
            return value
        }
    }
    return getMaxConcurrentJobsForPlatformPlan({ platformId })
}

async function tryAcquireSlot(jobId: string, jobData: ExecuteFlowJobData, log: FastifyBaseLogger): Promise<boolean> {
    const flowTimeoutInMilliseconds = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS), 'seconds').add(1, 'minute').asMilliseconds()
    const { data: poolId } = await tryCatch(() => concurrencyPoolService(log).getProjectPoolId(jobData.projectId))
    const effectivePoolId = poolId ?? jobData.projectId
    const maxConcurrentJobs = await getMaxConcurrentJobs({
        poolId,
        platformId: jobData.platformId,
        log,
    })
    const setKey = getConcurrencyPoolSetKey(effectivePoolId)
    const currentTime = Date.now()
    const member = `${jobData.projectId}:${jobId}`
    const redisConnection = await redisConnections.useExisting()

    const result = await redisConnection.eval(
        `
local setKey = KEYS[1]
local currentTime = tonumber(ARGV[1])
local timeoutMs = tonumber(ARGV[2])
local maxJobs = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', setKey, '-inf', currentTime - timeoutMs)

local existingScore = redis.call('ZSCORE', setKey, member)
if existingScore then
    return 0
end

local currentSize = redis.call('ZCARD', setKey)
if currentSize >= maxJobs then
    return 1
end

redis.call('ZADD', setKey, currentTime, member)
redis.call('EXPIRE', setKey, math.ceil(timeoutMs / 1000))

return 0
`,
        1,
        setKey,
        currentTime.toString(),
        flowTimeoutInMilliseconds.toString(),
        maxConcurrentJobs.toString(),
        member,
    ) as number

    return result === 0
}

async function releaseSlot(jobId: string, jobData: ExecuteFlowJobData, log: FastifyBaseLogger): Promise<void> {
    const { data: poolId } = await tryCatch(() => concurrencyPoolService(log).getProjectPoolId(jobData.projectId))
    const effectivePoolId = poolId ?? jobData.projectId
    const setKey = getConcurrencyPoolSetKey(effectivePoolId)
    const member = `${jobData.projectId}:${jobId}`
    const redisConnection = await redisConnections.useExisting()
    await redisConnection.eval(
        `
local setKey = KEYS[1]
local member = ARGV[1]
redis.call('ZREM', setKey, member)
return 1
`,
        1,
        setKey,
        member,
    )
}

export const rateLimiterInterceptor: JobInterceptor = {
    async preDispatch({ jobId, jobData, job, log }): Promise<InterceptorResult> {
        if (!shouldContinue(jobData)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }

        const allowed = await tryAcquireSlot(jobId, jobData, log)
        if (allowed) {
            log.debug({ jobId, projectId: jobData.projectId }, '[rateLimiterInterceptor] Job allowed')
            return { verdict: InterceptorVerdict.ALLOW }
        }

        const delayInMs = Math.min(600_000, 20_000 * Math.pow(2, job.attemptsMade))
        log.info({ jobId, projectId: jobData.projectId, delayInMs }, '[rateLimiterInterceptor] Job rate limited')
        return {
            verdict: InterceptorVerdict.REJECT,
            delayInMs,
            priority: JOB_PRIORITY[RATE_LIMIT_PRIORITY],
        }
    },

    async onJobFinished({ jobId, jobData, log }): Promise<void> {
        if (!shouldContinue(jobData)) {
            return
        }
        await releaseSlot(jobId, jobData, log)
        log.debug({ jobId, projectId: jobData.projectId }, '[rateLimiterInterceptor] Slot released')
    },
}
