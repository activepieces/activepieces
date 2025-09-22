import { AppSystemProp, QueueName } from '@activepieces/server-shared'
import { isNil, JobData } from '@activepieces/shared'
import { Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis'
import { system } from '../../helper/system/system'
import { jobConsumer } from '../consumer'
import { redisRateLimiter } from './redis-rate-limiter'

const consumer: Record<string, Worker> = {}


export const jobQueueWorker = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const sharedConsumers = Object.values(QueueName).map((queueName) => ensureWorkerExists(queueName, log))
        await Promise.all(sharedConsumers)
    },
    async close(): Promise<void> {
        const promises = Object.values(consumer).map(consumer => consumer.close())
        await Promise.all(promises)
    },
    async run(): Promise<void> {
        const promises = Object.values(consumer).map(consumer => consumer.run())
        await Promise.all(promises)
    },
})


async function ensureWorkerExists(queueName: QueueName, log: FastifyBaseLogger): Promise<Worker> {
    if (!isNil(consumer[queueName])) {
        return consumer[queueName]
    }
    const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
    consumer[queueName] = new Worker<JobData>(queueName, async (job) => {
        try {
            if (!isNil(job.id)) {
                await jobConsumer(log).consume(job.id, queueName, job.data, job.attemptsStarted)
            }
        }
        finally {
            await redisRateLimiter(log).onCompleteOrFailedJob(job.data, job.id)
        }
    }, {
        connection: await redisConnections.createNew(),
        telemetry: isOtpEnabled ? new BullMQOtel(queueName) : undefined,
        concurrency: 60,
        autorun: false,
        stalledInterval: 30000,
        maxStalledCount: 5,
    })

    await consumer[queueName].waitUntilReady()
    return consumer[queueName]
}

