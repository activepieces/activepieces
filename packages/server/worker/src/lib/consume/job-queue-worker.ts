import { getPlatformQueueName, QueueName } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    ConsumeJobResponseStatus,
    ExecutionType,
    isNil,
    JOB_PRIORITY,
    JobData,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RATE_LIMIT_PRIORITY,
    WorkerJobType,
} from '@activepieces/shared'
import { DelayedError, Worker } from 'bullmq'
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
    async start(): Promise<void> {
        if (!isNil(worker)) {
            return
        }
        const isOtpEnabled = workerMachine.getSettings().OTEL_ENABLED
        const queueName = getWorkerQueueName()
        worker = new Worker<JobData>(queueName, async (job, token) => {
            try {

                const deprecatedJobs = ['DELAYED_FLOW']
                if (deprecatedJobs.includes(job.data.jobType)) {
                    log.info({
                        jobId: job.id,
                        jobData: job.data,
                    }, '[jobQueueWorker] Skipping deprecated job')
                    return
                }
                const isOldSchemaVersion = ('schemaVersion' in job.data ? job.data.schemaVersion : 0) !== LATEST_JOB_DATA_SCHEMA_VERSION
                if (isOldSchemaVersion) {
                    const newJobData = await workerApiService().migrateJob({ jobData: job.data  }) as JobData
                    await job.updateData(newJobData)
                }

                const jobId = job.id
                assertNotNullOrUndefined(jobId, 'jobId')
                const { shouldRateLimit } = await workerJobRateLimiter(log).shouldBeLimited(jobId, job.data)
                if (shouldRateLimit) {
                    const baseDelay = Math.min(600, 20 * Math.pow(2, job.attemptsStarted))
                    const randomFactor = 0.6 + Math.random() * 0.4
                    const delayInSeconds = Math.round(baseDelay * randomFactor)
                    await job.moveToDelayed(
                        dayjs().add(delayInSeconds, 'seconds').valueOf(),
                        token,
                    )
                    log.info({
                        message: '[jobQueueWorker] Job is throttled and will be retried',
                        jobId,
                        delayInSeconds,
                    })
                    await job.changePriority({
                        priority: JOB_PRIORITY[RATE_LIMIT_PRIORITY],
                    })
                    throw new DelayedError(
                        'Thie job is rate limited and will be retried',
                    )
                }
                const response = await jobConsmer(log).consumeJob(job)
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



function getWorkerQueueName(): string {
    const platformIdForDedicatedWorker = workerMachine.getSettings().PLATFORM_ID_FOR_DEDICATED_WORKER
    if (!isNil(platformIdForDedicatedWorker)) {
        return getPlatformQueueName(platformIdForDedicatedWorker)
    }
    return QueueName.WORKER_JOBS
}

