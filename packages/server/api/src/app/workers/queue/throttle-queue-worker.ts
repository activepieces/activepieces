
import { QueueName } from '@activepieces/server-shared'
import { ExecuteFlowJobData, isNil, JobData } from '@activepieces/shared'
import { Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from 'server-worker'
import { redisConnections } from '../../database/redis-connections'
import { jobQueue } from './job-queue'
import { JobType } from './queue-manager'

let throttledWorker: Worker<JobData> | undefined

export const throttleQueueWorker = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const isOtpEnabled = workerMachine.getSettings().OTEL_ENABLED

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
            telemetry: isOtpEnabled ? new BullMQOtel(QueueName.WORKER_JOBS) : undefined,
            concurrency: workerMachine.getSettings().WORKER_CONCURRENCY,
            autorun: true,
            stalledInterval: 30000,
            maxStalledCount: 5,
        })

        await throttledWorker.waitUntilReady()
    },
    async close(): Promise<void> {
        if (!isNil(throttledWorker)) {
            await throttledWorker.close()
        }
    },
})