
import { AppSystemProp, QueueName } from '@activepieces/server-shared'
import { ExecuteFlowJobData, isNil, JobData } from '@activepieces/shared'
import { Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { jobQueue } from './job-queue'
import { JobType } from './queue-manager'

let throttledWorker: Worker<JobData> | undefined
const projectRateLimiterEnabled = system.getBoolean(AppSystemProp.PROJECT_RATE_LIMITER_ENABLED)
const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)

export const throttleQueueWorker = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        if (!projectRateLimiterEnabled) {
            return
        }
        throttledWorker = new Worker<JobData>(QueueName.THROTTLED_JOBS, async (job) => {
            log.info({
                message: '[throttledJobQueueWorker] Re-adding job to main job queue',
                jobId: job.id,
            })
            await jobQueue(log).add({
                data: job.data as ExecuteFlowJobData,
                type: JobType.ONE_TIME,
                id: job.id!,
            })
        }, {
            connection: await redisConnections.create(),
            telemetry: isOtpEnabled ? new BullMQOtel(QueueName.THROTTLED_JOBS) : undefined,
            autorun: true,
            stalledInterval: 30000,
            maxStalledCount: 5,
        })

        await throttledWorker.waitUntilReady()
    },
    async close(): Promise<void> {
        if (!projectRateLimiterEnabled) {
            return
        }
        if (!isNil(throttledWorker)) {
            await throttledWorker.close()
        }
    },
})