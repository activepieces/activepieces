import { QueueName } from '@activepieces/server-shared'
import {
    ExecuteFlowJobData,
    isNil,
    JobData,
} from '@activepieces/shared'
import { Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'
import { workerRedisConnections } from '../utils/worker-redis'
import { jobQueue } from '../../../../api/src/app/workers/queue/job-queue';
import { JobType } from '../../../../api/src/app/workers/queue/queue-manager';

let worker: Worker<JobData>

export const throttledJobQueueWorker = (log: FastifyBaseLogger) => ({
    async start(workerToken: string): Promise<void> {
        if (!isNil(worker)) {
            return
        }

        const isOtpEnabled = workerMachine.getSettings().OTEL_ENABLED
        const queueName = QueueName.THROTTLED_JOBS

        worker = new Worker<JobData>(queueName, async (job, token) => {
            log.info({
                message: '[throttledJobQueueWorker] Re-adding job to main job queue',
                jobId: job.id,
            })

            await jobQueue(log).add({
                data: job.data as ExecuteFlowJobData,
                type: JobType.ONE_TIME,
                id: job.id!,
            })

            log.info({
                message: '[throttledJobQueueWorker] Successfully re-added job to main job queue',
                jobId: job.id,
            })
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
        })

        await worker.waitUntilReady()

        log.info({
            message: 'Throttled job queue worker started',
        })
    },

    async close(): Promise<void> {
        if (isNil(worker)) {
            return
        }
        await worker.close()
    },
})
