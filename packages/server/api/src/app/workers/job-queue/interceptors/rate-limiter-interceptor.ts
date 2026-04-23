import { apDayjsDuration } from '@activepieces/server-utils'
import { ApEdition, ExecuteFlowJobData, isNil, JOB_PRIORITY, JobData, PlanName, PlatformId, RATE_LIMIT_PRIORITY, RunEnvironment, tryCatch, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getPlatformPlanNameKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { concurrencyPoolService } from '../../../ee/platform/concurrency-pool/concurrency-pool.service'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'
import { jobQueue } from '../job-queue'
import { concurrencyPoolRedis } from './concurrency-pool-redis'

export const rateLimiterInterceptor: JobInterceptor = {
    async preDispatch({ jobId, jobData, log }): Promise<InterceptorResult> {
        if (!shouldContinue(jobData)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }

        const { poolId, effectivePoolId } = await resolveEffectivePoolId({ projectId: jobData.projectId, log })
        const maxConcurrentJobs = await getMaxConcurrentJobs({ poolId, platformId: jobData.platformId, log })
        const outcome = await concurrencyPoolRedis.acquireSlotOrEnqueue({
            poolId: effectivePoolId,
            member: concurrencyPoolRedis.buildMember({ projectId: jobData.projectId, jobId }),
            maxJobs: maxConcurrentJobs,
            timeoutMs: getStaleEntryThresholdMs(),
        })

        if (outcome === 'acquired') {
            log.debug({ jobId, projectId: jobData.projectId }, '[rateLimiterInterceptor] Job allowed')
            return { verdict: InterceptorVerdict.ALLOW }
        }

        const delayInMs = getFlowTimeoutMs() + SAFETY_NET_DELAY_BUFFER_MS
        log.info({ jobId, projectId: jobData.projectId, delayInMs }, '[rateLimiterInterceptor] Job enqueued to waitlist')
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

        const { effectivePoolId } = await resolveEffectivePoolId({ projectId: jobData.projectId, log })
        const timeoutMs = getStaleEntryThresholdMs()
        const popped = await concurrencyPoolRedis.releaseSlotAndPopWaiter({
            poolId: effectivePoolId,
            member: concurrencyPoolRedis.buildMember({ projectId: jobData.projectId, jobId }),
            timeoutMs,
        })
        if (isNil(popped)) {
            return
        }

        const parsed = concurrencyPoolRedis.parseMember(popped)
        if (isNil(parsed)) {
            log.warn({ popped }, '[rateLimiterInterceptor] popped waiter has invalid format, dropping')
            await concurrencyPoolRedis.dropPromotedMember({ poolId: effectivePoolId, member: popped })
            return
        }

        const promoted = await jobQueue(log).promoteJob({
            jobId: parsed.jobId,
            platformId: jobData.platformId,
        })

        if (promoted) {
            log.debug({ promotedJobId: parsed.jobId, poolId: effectivePoolId }, '[rateLimiterInterceptor] Waiter promoted')
            return
        }

        log.warn({ popped, poolId: effectivePoolId }, '[rateLimiterInterceptor] Waiter promotion failed, rolling back slot')
        await concurrencyPoolRedis.rollbackPromotion({ poolId: effectivePoolId, member: popped, timeoutMs })
    },
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

async function resolveEffectivePoolId({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<{ poolId: string | null, effectivePoolId: string }> {
    const { data: poolId } = await tryCatch(() => concurrencyPoolService(log).getProjectPoolId(projectId))
    const effectivePoolId = poolId ?? projectId
    return { poolId: poolId ?? null, effectivePoolId }
}

async function getMaxConcurrentJobs({ poolId, platformId, log }: { poolId: string | null, platformId: PlatformId, log: FastifyBaseLogger }): Promise<number> {
    if (!isNil(poolId)) {
        const { data: value, error } = await tryCatch(() => concurrencyPoolService(log).getPoolLimit(poolId))
        if (error === null && !isNil(value)) {
            return value
        }
    }
    if (system.getEdition() !== ApEdition.CLOUD) {
        return system.getNumberOrThrow(AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT)
    }
    const platformPlanName = await distributedStore.get<string>(getPlatformPlanNameKey(platformId))
    if (!isNil(platformPlanName)) {
        const limit = PLAN_CONCURRENT_JOBS_LIMITS[platformPlanName]
        if (!isNil(limit)) return limit
    }
    return system.getNumberOrThrow(AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT)
}

function getFlowTimeoutMs(): number {
    return apDayjsDuration(system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS), 'seconds').asMilliseconds()
}

function getStaleEntryThresholdMs(): number {
    return getFlowTimeoutMs() + STALE_ENTRY_GRACE_MS
}

const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]
const STALE_ENTRY_GRACE_MS = apDayjsDuration(60, 'seconds').asMilliseconds()
const SAFETY_NET_DELAY_BUFFER_MS = apDayjsDuration(120, 'seconds').asMilliseconds()

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
