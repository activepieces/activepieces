import { apDayjsDuration, getPlatformPlanNameKey, getProjectMaxConcurrentJobsKey } from '@activepieces/server-shared'
import {
    ApEdition,
    assertNotNullOrUndefined,
    ExecuteFlowJobData,
    isNil,
    JobData,
    PlanName,
    PlatformId,
    ProjectId,
    RunEnvironment,
    WorkerJobType
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'
import { workerDistributedStore, workerRedisConnections } from '../utils/worker-redis'
import { jobQueue } from '../../../../api/src/app/workers/queue/job-queue';
import { JobType } from '../../../../api/src/app/workers/queue/queue-manager';
import { throttledJobQueue } from '../../../../api/src/app/workers/queue/throttled-job-queue';


export const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]
const projectActiveSetKey = (projectId: string): string => `active_jobs_set_2:${projectId}`
const projectWaitingSetKey = (projectId: string): string => `waiting_jobs_set:${projectId}`

export const workerJobRateLimiter = (_log: FastifyBaseLogger) => ({
    async throttleJob(id: string, data: JobData): Promise<void> {
        const redis = await workerRedisConnections.useExisting()
        const key = projectWaitingSetKey(data.projectId!)

        await redis.zadd(key, Date.now(), id)

        await throttledJobQueue(_log).add({ id, data })
    },

    async onCompleteOrFailedJob(data: JobData, jobId: string | undefined): Promise<void> {
        const projectRateLimiterEnabled = workerMachine.getSettings().PROJECT_RATE_LIMITER_ENABLED
        if (!RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType) || !projectRateLimiterEnabled || isNil(jobId)) {
            return
        }
        const castedJob = data as ExecuteFlowJobData
        if (castedJob.environment === RunEnvironment.TESTING) {
            return
        }

        const redis = await workerRedisConnections.useExisting()

        const activeSetKey = projectActiveSetKey(castedJob.projectId)
        const waitingSetKey = projectWaitingSetKey(castedJob.projectId)

        await redis.srem(activeSetKey, jobId)

        const [nextJobId] = await redis.zrange(waitingSetKey, 0, 0)
        if (isNil(nextJobId)) {
            return
        }

        const nextJobData = await throttledJobQueue(_log).getJobById(nextJobId)
        assertNotNullOrUndefined(nextJobData, 'nextJobData')

        await jobQueue(_log).add({
            data: nextJobData as ExecuteFlowJobData,
            type: JobType.ONE_TIME,
            id: nextJobId!,
        })

        await redis.zrem(waitingSetKey, nextJobId)
    },
    async shouldBeLimited(jobId: string | undefined, data: JobData): Promise<{
        shouldRateLimit: boolean
    }> {
        const projectRateLimiterEnabled = workerMachine.getSettings().PROJECT_RATE_LIMITER_ENABLED
        const flowTimeoutInMilliseconds = apDayjsDuration(workerMachine.getSettings().FLOW_TIMEOUT_SECONDS, 'seconds').add(1, 'minute').asMilliseconds()
        if (isNil(data.projectId) || !projectRateLimiterEnabled || isNil(jobId) || !RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType)) {
            return {
                shouldRateLimit: false,
            }
        }
        const castedJob = data as ExecuteFlowJobData
        if (castedJob.environment === RunEnvironment.TESTING) {
            return {
                shouldRateLimit: false,
            }
        }

        const maxConcurrentJobsPerProject = await getMaxConcurrentJobsPerProject({
            projectId: data.projectId,
            platformId: data.platformId,
        })
        const setKey = projectActiveSetKey(data.projectId)
        const redis = await workerRedisConnections.useExisting()

        const result = await redis.eval(
            `
local setKey = KEYS[1]
local jobId = ARGV[1]
local maxConcurrent = tonumber(ARGV[2])

local size = redis.call('SCARD', setKey)
if size >= maxConcurrent then
    return 1 -- Should rate limit
end

redis.call('SADD', setKey, jobId)
return 0 -- Should not rate limit
`,
            1,
            setKey,
            jobId,
            maxConcurrentJobsPerProject
        );

        return {
            shouldRateLimit: result === 1
        };
    },

})

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

function concurrentJobsFromPlan({ platformId, storedValues }: GetConcurrentJobsFromPlanParams): number | null {
    if (workerMachine.getSettings().EDITION !== ApEdition.CLOUD) {
        return null
    }

    const planNameKey = getPlatformPlanNameKey(platformId)
    const platformPlanName = storedValues[planNameKey]

    if (isNil(platformPlanName)) {
        return null
    }

    return PLAN_CONCURRENT_JOBS_LIMITS[platformPlanName] ?? null
}

async function getMaxConcurrentJobsPerProject({ projectId, platformId }: GetMaximumConcurrentJovsPerProjectParams): Promise<number> {
    const storedValues = await workerDistributedStore.getAll<string>([getPlatformPlanNameKey(platformId)])

    const concurrentJobsFromPlanValue = concurrentJobsFromPlan({ platformId, storedValues })
    if (!isNil(concurrentJobsFromPlanValue)) {
        return concurrentJobsFromPlanValue
    }

    return workerMachine.getSettings().MAX_CONCURRENT_JOBS_PER_PROJECT
}

type GetConcurrentJobsFromPlanParams = {
    platformId: PlatformId
    storedValues: Record<string, string | null>
}

type GetMaximumConcurrentJovsPerProjectParams = {
    platformId: PlatformId
    projectId: ProjectId | undefined
}