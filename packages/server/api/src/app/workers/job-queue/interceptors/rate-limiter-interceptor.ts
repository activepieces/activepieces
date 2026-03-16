import { apDayjsDuration } from '@activepieces/server-utils'
import { ApEdition, ExecuteFlowJobData, isNil, JOB_PRIORITY, JobData, PlanName, PlatformId, ProjectId, RATE_LIMIT_PRIORITY, RunEnvironment, WorkerJobType } from '@activepieces/shared'
import { getPlatformPlanNameKey, getProjectMaxConcurrentJobsKey } from '../../../database/redis/keys'
import { distributedStore, redisConnections } from '../../../database/redis-connections'
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

const projectSetKey = (projectId: string): string => `active_jobs_set:${projectId}`

function shouldSkip(jobData: JobData): boolean {
    if (!system.getBoolean(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED)) {
        return true
    }
    if (!RATE_LIMIT_WORKER_JOB_TYPES.includes(jobData.jobType)) {
        return true
    }
    const castedJob = jobData as ExecuteFlowJobData
    if (castedJob.environment === RunEnvironment.TESTING) {
        return true
    }
    return false
}

function concurrentJobsFromProject(projectId: string | undefined, storedValues: Record<string, string | null>): number | null {
    if (isNil(projectId)) {
        return null
    }
    const storedValue = storedValues[getProjectMaxConcurrentJobsKey(projectId)]
    if (isNil(storedValue)) {
        return null
    }
    return Number(storedValue)
}

function concurrentJobsFromPlan(platformId: PlatformId, storedValues: Record<string, string | null>): number | null {
    if (system.getEdition() !== ApEdition.CLOUD) {
        return null
    }
    const platformPlanName = storedValues[getPlatformPlanNameKey(platformId)]
    if (isNil(platformPlanName)) {
        return null
    }
    return PLAN_CONCURRENT_JOBS_LIMITS[platformPlanName] ?? null
}

async function getMaxConcurrentJobsPerProject({ projectId, platformId }: { projectId: ProjectId | undefined, platformId: PlatformId }): Promise<number> {
    const keys = [getPlatformPlanNameKey(platformId)]
    if (!isNil(projectId)) {
        keys.push(getProjectMaxConcurrentJobsKey(projectId))
    }
    const storedValues = await distributedStore.getAll<string>(keys)

    const fromProject = concurrentJobsFromProject(projectId, storedValues)
    if (!isNil(fromProject)) {
        return fromProject
    }

    const fromPlan = concurrentJobsFromPlan(platformId, storedValues)
    if (!isNil(fromPlan)) {
        return fromPlan
    }

    return system.getNumberOrThrow(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT)
}

async function tryAcquireSlot(jobId: string, jobData: JobData): Promise<boolean> {
    const flowTimeoutInMilliseconds = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS), 'seconds').add(1, 'minute').asMilliseconds()
    const maxConcurrentJobs = await getMaxConcurrentJobsPerProject({
        projectId: jobData.projectId,
        platformId: jobData.platformId,
    })
    const setKey = projectSetKey(jobData.projectId!)
    const currentTime = Date.now()
    const jobWithTimestamp = `${jobId}:${currentTime}`
    const redisConnection = await redisConnections.useExisting()

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
            return 0
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
        maxConcurrentJobs.toString(),
        jobWithTimestamp,
    ) as number

    return result === 0
}

async function releaseSlot(jobId: string, jobData: JobData): Promise<void> {
    const setKey = projectSetKey(jobData.projectId!)
    const redisConnection = await redisConnections.useExisting()
    await redisConnection.eval(
        `
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
}

export const rateLimiterInterceptor: JobInterceptor = {
    async preDispatch({ jobId, jobData, job, log }): Promise<InterceptorResult> {
        if (shouldSkip(jobData)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }

        const allowed = await tryAcquireSlot(jobId, jobData)
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
        if (shouldSkip(jobData)) {
            return
        }
        await releaseSlot(jobId, jobData)
        log.debug({ jobId, projectId: jobData.projectId }, '[rateLimiterInterceptor] Slot released')
    },
}
