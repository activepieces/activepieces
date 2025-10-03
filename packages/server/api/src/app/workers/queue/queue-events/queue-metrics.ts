import { assertNotNullOrUndefined, WorkerJobStatus, WorkerJobType, WorkerJobTypeForMetrics } from '@activepieces/shared'
import { Queue, QueueEvents, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'
import { redisConnections } from '../../../database/redis'
import { bullMqQueue } from '../job-queue'

export const metricsRedisKey = (jobType: WorkerJobType, status: WorkerJobStatus) => `metrics:${jobType}:${status}`
export const jobStateRedisKey = (jobId: string) => `jobState:${jobId}`

type InternalEvent = {
    jobId: string
    status: WorkerJobStatus | 'completed'
    deleteState: boolean
}

let internalEventsQueue: Queue<InternalEvent> 
let internalEventsWorker: Worker<InternalEvent, unknown, string>

// events can be consumed before the prev event is processed
// we use a queue to store the events and a worker to process them
export const queueMetrics = (log: FastifyBaseLogger, queueEvents: QueueEvents) => ({

    attach: async () => {
        internalEventsQueue = new Queue('internalEventsQueue',
            {
                connection: await redisConnections.createNew()
            }
        )
        await internalEventsQueue.waitUntilReady();

        internalEventsWorker = new Worker(
            'internalEventsQueue',
            async (job) => {
                const { jobId, status, deleteState } = job.data
                await updateJobState(jobId, status, deleteState)
            },
            {
                connection: await redisConnections.createNew(),
                concurrency: 1,
            },
        )
        await internalEventsWorker.waitUntilReady()

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

        await internalEventsQueue?.disconnect()
        await internalEventsWorker?.close()
    },
})


const onAdded = (args: { jobId: string }) => addJobEvent({
    jobId: args.jobId,
    status: WorkerJobStatus.QUEUED,
    deleteState: false
})

const onDelayed = (args: { jobId: string }) => addJobEvent({
    jobId: args.jobId,
    status: WorkerJobStatus.DELAYED,
    deleteState: false
})

const onActive = (args: { jobId: string }) => addJobEvent({
    jobId: args.jobId,
    status: WorkerJobStatus.ACTIVE,
    deleteState: false
})

const onFailed = (args: { jobId: string }) => addJobEvent({
    jobId: args.jobId,
    status: WorkerJobStatus.FAILED,
    deleteState: true
})

const onCompleted = async (args: { jobId: string }) => addJobEvent({
    jobId: args.jobId,
    status: 'completed',
    deleteState: true
})

const addJobEvent = (event: InternalEvent) => internalEventsQueue.add("updateJobState", event)

const updateJobState = async (jobId: string, status: WorkerJobStatus | 'completed', deleteState = false) => {

    const job = await bullMqQueue?.getJob(jobId)

    const jobType: WorkerJobType | undefined = job?.data.jobType

    const redis = await redisConnections.useExisting()

    if (jobType && !(WorkerJobTypeForMetrics.includes(jobType))) return;
  
    status = (status === WorkerJobStatus.DELAYED && job?.attemptsMade > 0) ? WorkerJobStatus.RETRYING : status

    await decrPrevState(redis, jobId, jobType)

    if (status !== 'completed'){
        assertNotNullOrUndefined(jobType, 'jobType')
        await redis.incr(metricsRedisKey(jobType, status))
    }

    if (deleteState) {
        await redis.del(jobStateRedisKey(jobId))
    }
    else {
        await redis.hset(jobStateRedisKey(jobId), { status, jobType }) // jobType is also saved to handle cases where job is completed and removed from queue
    }
}

const decrPrevState = async (redis: Redis, jobId: string, jobType?: WorkerJobType) => {
    const prevState = await redis.hget(jobStateRedisKey(jobId), 'status')

    if (prevState) {
        jobType = jobType ?? (await redis.hget(jobStateRedisKey(jobId), 'jobType')) as WorkerJobType
        await redis.decr(metricsRedisKey(jobType, prevState as WorkerJobStatus))
    }
}