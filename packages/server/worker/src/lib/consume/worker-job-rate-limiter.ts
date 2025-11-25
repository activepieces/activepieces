import { apDayjsDuration, getPlatformPlanNameKey, getProjectMaxConcurrentJobsKey } from '@activepieces/server-shared'
import { ApEdition, ExecuteFlowJobData, isNil, JobData, PlanName, PlatformId, ProjectId, RunEnvironment, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'
import { workerDistributedStore, workerRedisConnections } from '../utils/worker-redis'


export const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]
const projectSetKey = (projectId: string): string => `active_jobs_set:${projectId}`

export const workerJobRateLimiter = (_log: FastifyBaseLogger) => ({
    async onCompleteOrFailedJob(data: JobData, jobId: string | undefined): Promise<void> {
        const projectRateLimiterEnabled = workerMachine.getSettings().PROJECT_RATE_LIMITER_ENABLED
        if (!RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType) || !projectRateLimiterEnabled || isNil(jobId)) {
            return
        }
        const castedJob = data as ExecuteFlowJobData
        if (castedJob.environment === RunEnvironment.TESTING) {
            return
        }

        const setKey = projectSetKey(castedJob.projectId)
        const redisConnection = await workerRedisConnections.useExisting()
        await redisConnection.eval(`
        local setKey = KEYS[1]
        local jobId = ARGV[1]
        
        -- Get all members of the set
        local members = redis.call('SMEMBERS', setKey)
        
        -- Find and remove the job entry that starts with jobId:
        for i = 1, #members do
            local member = members[i]
            if string.match(member, '^' .. jobId .. ':') then
                redis.call('SREM', setKey, member)
            end
        end
        
        return 1
            `,
        1,
        setKey,
        jobId,
        )
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
        const setKey = projectSetKey(data.projectId)
        const currentTime = Date.now()
        const jobWithTimestamp = `${jobId}:${currentTime}`
        const redisConnection = await workerRedisConnections.useExisting()

        const result = await redisConnection.eval(
            `
    local setKey = KEYS[1]
    local currentTime = tonumber(ARGV[1])
    local timeoutMs = tonumber(ARGV[2])
    local maxJobs = tonumber(ARGV[3])
    local newJobEntry = ARGV[4]
    
    -- Get all members of the set
    local members = redis.call('SMEMBERS', setKey)
    
    -- Clean up old jobs and check if job already exists
    local jobIdToCheck = string.match(newJobEntry, '^([^:]+):')
    for i = 1, #members do
        local member = members[i]
        local timestamp = string.match(member, ':(%d+)$')
        local existingJobId = string.match(member, '^([^:]+):')
        
        -- Clean up old jobs
        if timestamp and (currentTime - tonumber(timestamp)) > timeoutMs then
            redis.call('SREM', setKey, member)
        -- Check if the job already exists in the set
        elseif existingJobId == jobIdToCheck then
            return 0  -- fixed
        end
    end
    
    -- Check current size after cleanup
    local currentSize = redis.call('SCARD', setKey)
    
    if currentSize >= maxJobs then
        return 1  -- Should rate limit
    end
    
    -- Add new job with timestamp
    redis.call('SADD', setKey, newJobEntry)
    redis.call('EXPIRE', setKey, math.ceil(timeoutMs / 1000))
    
    return 0  -- Should not rate limit
`,
            1,
            setKey,
            currentTime.toString(),
            flowTimeoutInMilliseconds.toString(),
            maxConcurrentJobsPerProject.toString(),
            jobWithTimestamp,
        ) as number

        return {
            shouldRateLimit: result === 1,
        }
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

function concurrentJobsFromProject({ projectId, storedValues }: GetConcurrentJobsFromProjectParams): number | null {
    if (isNil(projectId)) {
        return null
    }
    const maxConcurrentJobsKey = getProjectMaxConcurrentJobsKey(projectId)
    const storedValue = storedValues[maxConcurrentJobsKey]
    
    if (isNil(storedValue)) {
        return null
    }
    
    return Number(storedValue)
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
    const keys = [getPlatformPlanNameKey(platformId)]
    if (!isNil(projectId)) {
        keys.push(getProjectMaxConcurrentJobsKey(projectId))
    }
    const storedValues = await workerDistributedStore.getAll<string>(keys)
    
    const concurrentJobsFromProjectValue = concurrentJobsFromProject({ projectId, storedValues })
    if (!isNil(concurrentJobsFromProjectValue)) {
        return concurrentJobsFromProjectValue
    }
    
    const concurrentJobsFromPlanValue = concurrentJobsFromPlan({ platformId, storedValues })
    if (!isNil(concurrentJobsFromPlanValue)) {
        return concurrentJobsFromPlanValue
    }
    
    return workerMachine.getSettings().MAX_CONCURRENT_JOBS_PER_PROJECT
}

type GetConcurrentJobsFromProjectParams = {
    projectId: ProjectId | undefined
    storedValues: Record<string, string | null>
}

type GetConcurrentJobsFromPlanParams = {
    platformId: PlatformId
    storedValues: Record<string, string | null>
}

type GetMaximumConcurrentJovsPerProjectParams = {
    platformId: PlatformId
    projectId: ProjectId | undefined
}