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
import { ConcurrencyPool, concurrencyPoolRedis } from './concurrency-pool-redis'

export const rateLimiterInterceptor: JobInterceptor = {
    async preDispatch({ jobId, jobData, log }): Promise<InterceptorResult> {
        if (!shouldContinue(jobData)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }

        const pool = await getPool({ jobData, log })
        const outcome = await pool.tryAcquire({ projectId: jobData.projectId, jobId })

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
        const pool = await getPool({ jobData, log })
        await pool.release({ projectId: jobData.projectId, jobId })
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

async function getPool({ jobData, log }: { jobData: ExecuteFlowJobData, log: FastifyBaseLogger }): Promise<ConcurrencyPool> {
    const explicitPoolId = await getExplicitPoolId({ projectId: jobData.projectId, log })
    const poolId = explicitPoolId ?? jobData.projectId
    return concurrencyPoolRedis.forPool({
        poolId,
        timeoutMs: getStaleEntryThresholdMs(),
        getMaxJobs: () => resolveMaxJobs({ explicitPoolId, platformId: jobData.platformId, log }),
        promote: ({ jobId }) => jobQueue(log).promoteJob({ jobId, platformId: jobData.platformId }),
        log,
    })
}

async function getExplicitPoolId({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<string | null> {
    const { data } = await tryCatch(() => concurrencyPoolService(log).getProjectPoolId(projectId))
    return data ?? null
}

async function resolveMaxJobs({ explicitPoolId, platformId, log }: { explicitPoolId: string | null, platformId: PlatformId, log: FastifyBaseLogger }): Promise<number> {
    if (!isNil(explicitPoolId)) {
        const { data, error } = await tryCatch(() => concurrencyPoolService(log).getPoolLimit(explicitPoolId))
        if (error === null && !isNil(data)) {
            return data
        }
    }
    if (system.getEdition() !== ApEdition.CLOUD) {
        return system.getNumberOrThrow(AppSystemProp.DEFAULT_CONCURRENT_JOBS_LIMIT)
    }
    const planName = await distributedStore.get<string>(getPlatformPlanNameKey(platformId))
    if (!isNil(planName)) {
        const planLimit = PLAN_CONCURRENT_JOBS_LIMITS[planName]
        if (!isNil(planLimit)) return planLimit
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
