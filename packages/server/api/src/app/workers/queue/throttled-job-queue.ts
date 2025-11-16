import {
    AppSystemProp,
    QueueName
} from '@activepieces/server-shared'
import { isNil, JobData } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AddJobParams, JobType } from './queue-manager'

let queue: Queue<JobData> | undefined

export const throttledJobQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        await ensureQueueExists(log)
    },

    async add(params: Omit<AddJobParams<JobType.ONE_TIME | JobType.REPEATING>, 'type'>): Promise<void> {
        const { data } = params

        const queue = await ensureQueueExists(log)

        await queue.add(params.id, data, { jobId: params.id })
    },

    async getJobById(jobId: string): Promise<JobData | null> {
        const queue = await ensureQueueExists(log)
        const job = await queue.getJob(jobId)
        if (isNil(job)) {
            return null
        }
        return job.data
    },

    get(): Queue<JobData> {
        if (!isNil(queue)) {
            throw new Error('Throttled job queue not initialized')
        }
        return queue!
    },

    async close(): Promise<void> {
        if (queue) {
            await queue.close()
        }
    },
})

async function ensureQueueExists(log: FastifyBaseLogger): Promise<Queue<JobData>> {
    if (!queue) {
        const queueName = QueueName.THROTTLED_JOBS

        const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
        queue = new Queue(queueName, {
            telemetry: isOtpEnabled ? new BullMQOtel(queueName) : undefined,
            connection: await redisConnections.create(),
        })

        await queue.removeGlobalConcurrency()
        await queue.waitUntilReady()

        log.info({
            queueName,
        }, '[throttleJobQueue#ensureQueueExists] Queue created')
    }

    return queue
}


