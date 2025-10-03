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
-- KEYS[2] = newMetricsKey (if status != 'completed')
-- ARGV[1] = status
-- ARGV[2] = jobType
-- ARGV[3] = deleteState ('false' or 'true')

local jobStateKey = KEYS[1]
local newMetricsKey = KEYS[2]

local status = tostring(ARGV[1])
local jobType = tostring(ARGV[2])
local deleteState = ARGV[3] == 'true'

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
        local metricsKey = 'metrics:' .. jobType .. ':' .. prevState
        redis.call('DECR', metricsKey)
    end
end

-- Increment new state if not completed and jobType exists
if status ~= 'completed' and jobType and jobType ~= '' then
    local metricsKey = newMetricsKey
    if metricsKey == '' then
        metricsKey = 'metrics:' .. jobType .. ':' .. status
    end
    redis.call('INCR', metricsKey)
end

-- Update or delete job state
if deleteState then
    redis.call('DEL', jobStateKey)
else
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

const updateJobState = async (jobId: string, status: WorkerJobStatus | 'completed', deleteState = false) => {

    const job = await bullMqQueue?.getJob(jobId)

    const jobType: WorkerJobType | undefined = job?.data.jobType

    if (jobType && !(WorkerJobTypeForMetrics.includes(jobType))) return;
  
    status = (status === WorkerJobStatus.DELAYED && job?.attemptsMade > 0) ? WorkerJobStatus.RETRYING : status

    const redis = await redisConnections.useExisting()
    
    const jobStateKey = jobStateRedisKey(jobId)
    const newMetricsKey = status !== 'completed' && jobType ? metricsRedisKey(jobType, status as WorkerJobStatus) : ''
    
    await redis.eval(
        updateJobStateScript,
        2,
        jobStateKey,
        newMetricsKey,
        status,
        jobType || '',
        deleteState.toString()
    )
}