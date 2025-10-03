import { WorkerJobStatus, WorkerJobType, WorkerJobTypeForMetrics } from '@activepieces/shared'
import { QueueEvents } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis'
import { bullMqQueue } from '../job-queue'

export const metricsRedisKey = (jobType: WorkerJobType, status: WorkerJobStatus) => `metrics:${jobType}:${status}`
export const jobStateRedisKey = (jobId: string) => `jobState:${jobId}`

const updateJobStateScript = `-- Lua script to atomically update job state and metrics
-- Arguments:
-- KEYS[1] = jobStateRedisKey(jobId)
-- KEYS[2] = prevMetricsKey (if prevState exists)
-- KEYS[3] = newMetricsKey (if status != 'completed')
-- ARGV[1] = status
-- ARGV[2] = jobType
-- ARGV[3] = deleteState ('false' or 'true')

local jobStateKey = KEYS[1]
local prevMetricsKey = KEYS[2]
local newMetricsKey = KEYS[3]

local status = ARGV[1]
local jobType = ARGV[2]
local deleteState = ARGV[3] == 'false'

-- Get current job state
local prevState = redis.call('HGET', jobStateKey, 'status')
local prevJobType = redis.call('HGET', jobStateKey, 'jobType')

-- Use provided jobType or get from stored state
if jobType == '' then
    jobType = prevJobType
end

-- Decrement previous state if it exists
if prevState and prevState ~= '' then
    if jobType and jobType ~= '' then
        -- Use provided prevMetricsKey or construct it
        if prevMetricsKey == '' then
            prevMetricsKey = 'metrics:' .. jobType .. ':' .. prevState
        end
        redis.call('DECR', prevMetricsKey)
    end
end

-- Increment new state if not completed and jobType exists
if status ~= 'completed' and jobType and jobType ~= '' then
    if newMetricsKey == '' then
        newMetricsKey = 'metrics:' .. jobType .. ':' .. status
    end
    redis.call('INCR', newMetricsKey)
end

-- Update or delete job state
if deleteState then
    redis.call('DEL', jobStateKey)
else
    -- Store both status and jobType for future reference
    redis.call('HSET', jobStateKey, 'status', status, 'jobType', jobType)
end

return {status, jobType}`

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

const updateJobState = async (jobId: string, status: WorkerJobStatus | 'completed', deleteState = false) => {

    const job = await bullMqQueue?.getJob(jobId)

    const jobType: WorkerJobType | undefined = job?.data.jobType

    if (jobType && !(WorkerJobTypeForMetrics.includes(jobType))) return;
  
    status = (status === WorkerJobStatus.DELAYED && job?.attemptsMade > 0) ? WorkerJobStatus.RETRYING : status

    const redis = await redisConnections.useExisting()
    
    const jobStateKey = jobStateRedisKey(jobId)
    const prevMetricsKey = '' // Will be constructed in script if needed
    const newMetricsKey = status !== 'completed' && jobType ? metricsRedisKey(jobType, status as WorkerJobStatus) : ''
    
    console.log(jobId, status)
    await redis.eval(
        updateJobStateScript,
        3, // number of keys
        jobStateKey,
        prevMetricsKey,
        newMetricsKey,
        status,
        jobType || '',
        deleteState.toString()
    )
    console.log(jobId, status)
}
