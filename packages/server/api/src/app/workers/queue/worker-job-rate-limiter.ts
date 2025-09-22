import { AppSystemProp } from '@activepieces/server-shared'
import { ExecuteFlowJobData, isNil, JobData, RunEnvironment, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis'
import { apDayjsDuration } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'


export const RATE_LIMIT_WORKER_JOB_TYPES = [WorkerJobType.EXECUTE_FLOW]

const MAX_CONCURRENT_JOBS_PER_PROJECT = system.getNumberOrThrow(AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT)
const PROJECT_RATE_LIMITER_ENABLED = system.getBoolean(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED)
const FLOW_TIMEOUT_IN_MILLISECONDS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS), 'seconds').add(1, 'minute').asMilliseconds()


const projectSetKey = (projectId: string): string => `active_jobs_set:${projectId}`

export const workerJobRateLimiter = (_log: FastifyBaseLogger) => ({
    async onCompleteOrFailedJob(data: JobData, jobId: string | undefined): Promise<void> {
        if (!RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType) || !PROJECT_RATE_LIMITER_ENABLED || isNil(jobId)) {
            return
        }
        const castedJob = data as ExecuteFlowJobData
        if(castedJob.environment === RunEnvironment.TESTING) {
            return
        }

        const setKey = projectSetKey(castedJob.projectId)
        const redisConnection = await redisConnections.useExisting()
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
        if (isNil(data.projectId) || !PROJECT_RATE_LIMITER_ENABLED || isNil(jobId) || !RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType)) {
            return {
                shouldRateLimit: false,
            }
        }
        const castedJob = data as ExecuteFlowJobData
        if(castedJob.environment === RunEnvironment.TESTING) {
            return {
                shouldRateLimit: false,
            }
        }

        const setKey = projectSetKey(data.projectId)
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
            local sizeNow = redis.call('SCARD', setKey)
            return { 0, sizeNow }  -- fixed
        end
    end
    
    -- Check current size after cleanup
    local currentSize = redis.call('SCARD', setKey)
    
    if currentSize >= maxJobs then
        return { 1, currentSize }  -- Should rate limit
    end
    
    -- Add new job with timestamp
    redis.call('SADD', setKey, newJobEntry)
    redis.call('EXPIRE', setKey, math.ceil(timeoutMs / 1000))
    
    return { 0, currentSize + 1 }  -- Should not rate limit
`,
            1,
            setKey,
            currentTime.toString(),
            FLOW_TIMEOUT_IN_MILLISECONDS.toString(),
            MAX_CONCURRENT_JOBS_PER_PROJECT.toString(),
            jobWithTimestamp,
        ) as [number, number]

        const [shouldRateLimit] = result

        return {
            shouldRateLimit: shouldRateLimit === 1,
        }
    },

})