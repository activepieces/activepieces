import { QueueName } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    ConsumeJobResponseStatus,
    ExecutionType,
    FlowExecutionState,
    flowExecutionStateKey,
    FlowStatus,
    isNil,
    JOB_PRIORITY,
    JobData,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RATE_LIMIT_PRIORITY,
    WorkerJobType,
} from '@activepieces/shared'
import { DelayedError, Job, Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../api/server-api.service'
import { workerMachine } from '../utils/machine'
import { workerRedisConnections } from '../utils/worker-redis'
import { jobConsmer } from './job-consmer'
import { workerJobRateLimiter } from './worker-job-rate-limiter'

let worker: Worker<JobData>

export const jobQueueWorker = (log: FastifyBaseLogger) => ({
    async start(workerToken: string): Promise<void> {
        if (!isNil(worker)) {
            return
        }
        const isOtpEnabled = workerMachine.getSettings().OTEL_ENABLED
        worker = new Worker<JobData>(QueueName.WORKER_JOBS, async (job, token) => {
            try {
                const jobId = job.id
                const { shouldSkip } = await preHandler(workerToken, job)
                if (shouldSkip) {
                    log.info({
                        jobId: job.id,
                        jobData: job.data,
                    }, '[jobQueueWorker] Skipping job')
                    return
                }

                assertNotNullOrUndefined(jobId, 'jobId')
                const { shouldRateLimit } = await workerJobRateLimiter(log).shouldBeLimited(jobId, job.data)
                if (shouldRateLimit) {
                    await job.moveToDelayed(
                        dayjs().add(Math.min(240, 20 * (job.attemptsStarted + 1)), 'seconds').valueOf(),
                        token,
                    )
                    log.info({
                        message: '[jobQueueWorker] Job is throttled and will be retried',
                        jobId,
                        delayInSeconds: Math.min(240, 20 * (job.attemptsStarted + 1)),
                    })
                    await job.changePriority({
                        priority: JOB_PRIORITY[RATE_LIMIT_PRIORITY],
                    })
                    throw new DelayedError(
                        'Thie job is rate limited and will be retried',
                    )
                }
                const response = await jobConsmer(log).consumeJob(job, workerToken)
                log.info({
                    message: '[jobQueueWorker] Consumed job',
                    response,
                })
                const isInternalError = response.status === ConsumeJobResponseStatus.INTERNAL_ERROR
                if (isInternalError) {
                    throw new Error(response.errorMessage ?? 'Unknown error')
                }
                const delayInSeconds = response.delayInSeconds
                if (!isNil(delayInSeconds) && job.data.jobType === WorkerJobType.EXECUTE_FLOW) {
                    await job.updateData({
                        ...job.data,
                        executionType: ExecutionType.RESUME,
                    })

                    await job.moveToDelayed(dayjs().add(delayInSeconds, 'seconds').valueOf(), job.token)
                    throw new DelayedError('Job requested to be delayed')
                }
            }
            finally {
                await workerJobRateLimiter(log).onCompleteOrFailedJob(
                    job.data,
                    job.id,
                )
            }
        },
        {
            connection: await workerRedisConnections.create(),
            telemetry: isOtpEnabled
                ? new BullMQOtel(QueueName.WORKER_JOBS)
                : undefined,
            concurrency: workerMachine.getSettings().WORKER_CONCURRENCY,
            autorun: true,
            stalledInterval: 30000,
            maxStalledCount: 5,
        },
        )
        await worker.waitUntilReady()
        log.info({
            message: 'Job queue worker started',
        })
    },
    async close(): Promise<void> {
        if (isNil(worker)) {
            return
        }
        await worker.close()
    },
})


async function preHandler(workerToken: string, job: Job<JobData>): Promise<{
    shouldSkip: boolean
}> {

    const skipFlow = await shouldSkipDisabledFlow(job.data)
    if (skipFlow) {
        return {
            shouldSkip: true,
        }
    }
    const deprecatedJobs = ['DELAYED_FLOW']
    if (deprecatedJobs.includes(job.data.jobType)) {
        return {
            shouldSkip: true,
        }
    }
    const schemaVersion = 'schemaVersion' in job.data ? job.data.schemaVersion : 0
    if (schemaVersion === LATEST_JOB_DATA_SCHEMA_VERSION) {
        return {
            shouldSkip: false,
        }
    }
    const newJobData = await workerApiService(workerToken).migrateJob({
        jobData: job.data,
    })
    await job.updateData(newJobData)
    return {
        shouldSkip: false,
    }
}

async function shouldSkipDisabledFlow(data: JobData): Promise<boolean> {
    if ('flowId' in data) {
        const flowId = data.flowId
        const redisConnection = await workerRedisConnections.useExisting()
        const flowExecutionStateString = await redisConnection.get(flowExecutionStateKey(flowId))
        if (isNil(flowExecutionStateString)) {
            return false
        }
        const flowExecutionState = JSON.parse(flowExecutionStateString) as FlowExecutionState
        if (!flowExecutionState.exists || flowExecutionState.flow.status === FlowStatus.DISABLED) {
            return true
        }
    }
    return false
}