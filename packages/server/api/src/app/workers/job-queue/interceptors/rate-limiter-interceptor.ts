import { isNil, PlatformId, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { ApEdition, ExecuteFlowJobData, getDefaultJobPriority, JOB_PRIORITY, JobData, PlanName, RATE_LIMIT_PRIORITY, RunEnvironment, WorkerJobType } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { getConcurrencyPoolParkedKey, getConcurrencyPoolSetKey, getPlatformPlanNameKey, PLATFORM_PLAN_NAME_TTL_SECONDS } from '../../../database/redis/keys'
import { distributedStore, redisConnections } from '../../../database/redis-connections'
import { concurrencyPoolService } from '../../../ee/platform/concurrency-pool/concurrency-pool.service'
import { workerGroupService } from '../../../ee/platform/platform-plan/worker-group.service'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { platformService } from '../../../platform/platform.service'
import { projectWorkerGroupService } from '../../../project/project-worker-group.service'
import { workerCapacity } from '../../machine/worker-capacity'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'
import { jobQueue } from '../job-queue'

const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]
const ParkedMember = z.tuple([z.string(), z.string(), z.number()])

const FREE_CONCURRENT_JOBS_LIMIT = 5
const SELF_SERVE_CONCURRENT_JOBS_LIMIT = 15
const ENTERPRISE_CONCURRENT_JOBS_LIMIT = 30

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


async function getMaxConcurrentJobsForPlatformPlan({ platformId, log }: { platformId: PlatformId, log: FastifyBaseLogger }): Promise<number> {
    if (system.getEdition() !== ApEdition.CLOUD) {
        return system.getNumberOrThrow(AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT)
    }
    const cachedPlanName = await distributedStore.get<string>(getPlatformPlanNameKey(platformId))
    if (!isNil(cachedPlanName)) {
        return concurrencyLimitForCloudPlan(cachedPlanName)
    }
    const { data: platform } = await tryCatch(() => platformService(log).getOneWithPlan(platformId))
    const planName = platform?.plan.plan ?? null
    if (!isNil(planName)) {
        await distributedStore.put(getPlatformPlanNameKey(platformId), planName, PLATFORM_PLAN_NAME_TTL_SECONDS)
    }
    return concurrencyLimitForCloudPlan(planName)
}

function concurrencyLimitForCloudPlan(planName: string | null): number {
    switch (planName ?? PlanName.FREE) {
        case PlanName.FREE:
            return FREE_CONCURRENT_JOBS_LIMIT
        case PlanName.APPSUMO:
        case PlanName.FREE_LEGACY:
        case PlanName.PLUS:
        case PlanName.PLUS_ANNUAL:
        case PlanName.PLUS_CHAT:
        case PlanName.TEAM:
        case PlanName.TEAM_ANNUAL:
            return SELF_SERVE_CONCURRENT_JOBS_LIMIT
        default:
            return ENTERPRISE_CONCURRENT_JOBS_LIMIT
    }
}

async function getMaxConcurrentJobs({ poolId, platformId, projectId, log }: { poolId: string | null, platformId: PlatformId, projectId: string, log: FastifyBaseLogger }): Promise<number> {
    // Explicit per-project limit (set via the By-project table / concurrency pool) overrides everything.
    if (!isNil(poolId)) {
        const { data: value, error } = await tryCatch(() => concurrencyPoolService(log).getPoolLimit(poolId))
        if (error === null && !isNil(value)) {
            return value
        }
    }
    const planLimit = await getMaxConcurrentJobsForPlatformPlan({ platformId, log })
    // When worker groups are enabled, an unassigned-limit project is capped by the physical capacity
    // of the pool its runs actually route to (group pool if it has live workers, else shared).
    const { data: workerGroupsEnabled } = await tryCatch(() => workerGroupService(log).isWorkerGroupsEnabled({ platformId }))
    if (workerGroupsEnabled !== true) {
        return planLimit
    }
    const slots = await resolveRoutedPoolSlots({ platformId, projectId, log })
    return slots > 0 ? Math.min(planLimit, slots) : planLimit
}

async function resolveRoutedPoolSlots({ platformId, projectId, log }: { platformId: PlatformId, projectId: string, log: FastifyBaseLogger }): Promise<number> {
    const { projectGroups, shared } = await workerCapacity.get()
    const { data: projectGroupId } = await tryCatch(() => projectWorkerGroupService(log).getProjectWorkerGroup({ projectId, platformId }))
    if (!isNil(projectGroupId)) {
        const groupCapacity = projectGroups.get(projectGroupId)
        if (!isNil(groupCapacity) && groupCapacity.online > 0) {
            return groupCapacity.slots
        }
    }
    return shared.slots
}

function encodeParkedMember({ queueName, jobId, priority }: { queueName: string, jobId: string, priority: number }): string {
    return JSON.stringify([queueName, jobId, priority])
}

function decodeParkedMember(member: string): { queueName: string, jobId: string, priority: number } | null {
    const { data: parsed } = tryCatchSync(() => JSON.parse(member))
    const result = ParkedMember.safeParse(parsed)
    if (!result.success) {
        return null
    }
    const [queueName, jobId, priority] = result.data
    return { queueName, jobId, priority }
}

async function tryAcquireSlot({ jobId, jobData, job, log }: { jobId: string, jobData: ExecuteFlowJobData, job: Job, log: FastifyBaseLogger }): Promise<boolean> {
    const flowTimeoutInMilliseconds = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS), 'seconds').add(1, 'minute').asMilliseconds()
    const { data: poolId } = await tryCatch(() => concurrencyPoolService(log).getProjectPoolId(jobData.projectId))
    const effectivePoolId = poolId ?? jobData.projectId
    const maxConcurrentJobs = await getMaxConcurrentJobs({
        poolId,
        platformId: jobData.platformId,
        projectId: jobData.projectId,
        log,
    })
    const setKey = getConcurrencyPoolSetKey(effectivePoolId)
    const parkedKey = getConcurrencyPoolParkedKey(effectivePoolId)
    const currentTime = Date.now()
    const member = `${jobData.projectId}:${jobId}`
    const parkedMember = encodeParkedMember({
        queueName: job.queueName,
        jobId,
        priority: JOB_PRIORITY[getDefaultJobPriority(jobData)],
    })
    const redisConnection = await redisConnections.useExisting()

    const result = await redisConnection.eval(
        `
local setKey = KEYS[1]
local parkedKey = KEYS[2]
local currentTime = tonumber(ARGV[1])
local timeoutMs = tonumber(ARGV[2])
local maxJobs = tonumber(ARGV[3])
local member = ARGV[4]
local parkedMember = ARGV[5]

redis.call('ZREMRANGEBYSCORE', setKey, '-inf', currentTime - timeoutMs)

local existingScore = redis.call('ZSCORE', setKey, member)
if existingScore then
    redis.call('ZREM', parkedKey, parkedMember)
    return 0
end

local currentSize = redis.call('ZCARD', setKey)
if currentSize >= maxJobs then
    redis.call('ZREMRANGEBYSCORE', parkedKey, '-inf', currentTime - timeoutMs)
    redis.call('ZADD', parkedKey, currentTime, parkedMember)
    redis.call('EXPIRE', parkedKey, math.ceil(timeoutMs / 1000))
    return 1
end

redis.call('ZADD', setKey, currentTime, member)
redis.call('EXPIRE', setKey, math.ceil(timeoutMs / 1000))
redis.call('ZREM', parkedKey, parkedMember)

return 0
`,
        2,
        setKey,
        parkedKey,
        currentTime.toString(),
        flowTimeoutInMilliseconds.toString(),
        maxConcurrentJobs.toString(),
        member,
        parkedMember,
    ) as number

    return result === 0
}

async function releaseSlot({ jobId, jobData, log }: { jobId: string, jobData: ExecuteFlowJobData, log: FastifyBaseLogger }): Promise<string> {
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
    return effectivePoolId
}

async function promoteNextParkedJob({ effectivePoolId, log }: { effectivePoolId: string, log: FastifyBaseLogger }): Promise<void> {
    const redisConnection = await redisConnections.useExisting()
    const parkedKey = getConcurrencyPoolParkedKey(effectivePoolId)
    for (let attempt = 0; attempt < 3; attempt++) {
        const popped = await redisConnection.zpopmin(parkedKey)
        if (popped.length === 0) {
            return
        }
        const decoded = decodeParkedMember(popped[0])
        if (isNil(decoded)) {
            log.warn({ pool: { id: effectivePoolId } }, '[rateLimiterInterceptor] Dropping undecodable parked entry')
            continue
        }
        const queue = await jobQueue(log).getOrCreateQueue({ queueName: decoded.queueName })
        const parkedJob = await Job.fromId(queue, decoded.jobId)
        if (isNil(parkedJob)) {
            log.debug({ job: { id: decoded.jobId }, queueName: decoded.queueName }, '[rateLimiterInterceptor] Parked job no longer exists, dropping')
            continue
        }
        await tryCatch(() => parkedJob.changePriority({ priority: decoded.priority }))
        const { error } = await tryCatch(() => parkedJob.promote())
        if (error) {
            log.debug({ job: { id: decoded.jobId }, queueName: decoded.queueName, error: String(error) }, '[rateLimiterInterceptor] Parked job no longer delayed, dropping')
            continue
        }
        log.info({ job: { id: decoded.jobId }, queueName: decoded.queueName, pool: { id: effectivePoolId } }, '[rateLimiterInterceptor] Promoted parked job on slot release')
        return
    }
}

export const rateLimiterInterceptor: JobInterceptor = {
    async preDispatch({ jobId, jobData, job, log }): Promise<InterceptorResult> {
        if (!shouldContinue(jobData)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }

        const allowed = await tryAcquireSlot({ jobId, jobData, job, log })
        if (allowed) {
            log.debug({ job: { id: jobId }, project: { id: jobData.projectId } }, '[rateLimiterInterceptor] Job allowed')
            return { verdict: InterceptorVerdict.ALLOW }
        }

        const delayInMs = Math.min(600_000, 20_000 * Math.pow(2, job.attemptsMade))
        log.info({ job: { id: jobId }, project: { id: jobData.projectId }, delayInMs }, '[rateLimiterInterceptor] Job rate limited')
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
        const effectivePoolId = await releaseSlot({ jobId, jobData, log })
        log.debug({ job: { id: jobId }, project: { id: jobData.projectId } }, '[rateLimiterInterceptor] Slot released')
        const { error } = await tryCatch(() => promoteNextParkedJob({ effectivePoolId, log }))
        if (error) {
            log.warn({ pool: { id: effectivePoolId }, error: String(error) }, '[rateLimiterInterceptor] Failed to promote parked job')
        }
    },
}
