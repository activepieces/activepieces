import { isNil, isNotUndefined, NON_SCHEDULED_JOB_TYPES, WorkerJobStatus, WorkerJobType, WorkerJobTypeForMetrics } from '@activepieces/shared'
import { QueueEvents } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis'
import { system } from '../../helper/system/system'
import { workerJobsQueue } from './job-queue'

export const jobStatsRedisKeyPrefix = 'jobState'
export const metricsRedisKey = (jobType: WorkerJobType, status: WorkerJobStatus) => `metrics:${jobType}:${status}`
export const jobStateRedisKey = (jobId: string) => `${jobStatsRedisKeyPrefix}:${jobId}`

const updateJobStateScript = `-- Lua script to atomically update job state and metrics
-- Arguments:
-- KEYS[1] = jobStateRedisKey(jobId)
-- ARGV[1] = status
-- ARGV[2] = jobType
-- ARGV[3] = deleteState ('false' or 'true')

local jobStateKey = KEYS[1]

local status = ARGV[1]
local jobType = ARGV[2]
local deleteState = ARGV[3] == 'true'

-- Get current job state
local prevState = redis.call('HGET', jobStateKey, 'status')
local prevJobType = redis.call('HGET', jobStateKey, 'jobType')

-- Use provided jobType or get from stored state
if jobType == '' then
    jobType = prevJobType
end

-- Decrement previous state if it exists and value is greater than 0 to handle case where metrics are reset
if prevState and prevState ~= '' and jobType and jobType ~= '' then
    local metricsKey = 'metrics:' .. jobType .. ':' .. prevState
    local currentValue = redis.call('GET', metricsKey)
    if currentValue and tonumber(currentValue) and tonumber(currentValue) > 0 then
        redis.call('DECR', metricsKey)
    end
end

-- Increment new state if not completed and jobType exists
if status ~= 'completed' and jobType and jobType ~= '' then
    local metricsKey = 'metrics:' .. jobType .. ':' .. status
    redis.call('INCR', metricsKey)
end

-- Update or delete job state
if deleteState then
    redis.call('DEL', jobStateKey)
elseif jobType and jobType ~= '' then
    -- Store both status and jobType for future reference
    redis.call('HMSET', jobStateKey, 'status', status, 'jobType', jobType)
end
`

export const queueMetrics = (log: FastifyBaseLogger, queueEvents: QueueEvents) => ({

    attach: async () => {
        queueEvents.on('added', onAdded)
        queueEvents.on('delayed', onDelayed)
        queueEvents.on('active', onActive)
        queueEvents.on('failed', onFailed)
        queueEvents.on('completed', onCompleted)
    },
    detach: async () => {
        queueEvents.off('added', onAdded)
        queueEvents.off('delayed', onDelayed)
        queueEvents.off('active', onActive)
        queueEvents.off('failed', onFailed)
        queueEvents.off('completed', onCompleted)
    },
})


const onAdded = (args: { jobId: string }) => updateJobState(args.jobId, WorkerJobStatus.QUEUED)

const onDelayed = (args: { jobId: string }) => updateJobState(args.jobId, WorkerJobStatus.DELAYED)

const onActive = (args: { jobId: string }) => updateJobState(args.jobId, WorkerJobStatus.ACTIVE)

const onFailed = (args: { jobId: string }) => updateJobState(args.jobId, WorkerJobStatus.FAILED, true)

const onCompleted = (args: { jobId: string }) => updateJobState(args.jobId, 'completed', true)

const updateJobState = async (jobId: string, bullState: WorkerJobStatus | 'completed', deleteState = false) => {

    const job = await workerJobsQueue?.getJob(jobId)

    const logger =  system.globalLogger()

    const jobType = job?.data.jobType

    if (isNotUndefined(jobType) && !(WorkerJobTypeForMetrics.includes(jobType) || isNil(jobType))) return
  
    const state = (bullState === WorkerJobStatus.DELAYED && NON_SCHEDULED_JOB_TYPES.includes(jobType)) ? WorkerJobStatus.RETRYING : bullState

    const redis = await redisConnections.useExisting()
    
    const jobStateKey = jobStateRedisKey(jobId)
    
    await redis.eval(
        updateJobStateScript,
        1,
        jobStateKey,
        String(state),
        String(jobType || ''),
        String(deleteState),
    ).catch(error => {
        logger.error(error, '[updateJobState] Error handling event for saving queue metrics')
    })
}