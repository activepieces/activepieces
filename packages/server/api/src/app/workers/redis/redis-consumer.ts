import { AppSystemProp, QueueName } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { createRedisClient } from '../../database/redis-connection'
import { system } from '../../helper/system/system'
import { jobConsumer } from '../consumer/job-consumer'
import { ConsumerManager } from '../consumer/types'

const consumer: Record<string, Worker> = {}


export const redisConsumer = (log: FastifyBaseLogger): ConsumerManager => ({
    async init(): Promise<void> {
        const sharedConsumers = Object.values(QueueName).map((queueName) => ensureWorkerExists(queueName, log))
        await Promise.all(sharedConsumers)
    },
    async close(): Promise<void> {
        const promises = Object.values(consumer).map(consumer => consumer.close())
        await Promise.all(promises)
    },
})


async function ensureWorkerExists(queueName: QueueName, log: FastifyBaseLogger): Promise<Worker> {
    if (!isNil(consumer[queueName])) {
        return consumer[queueName]
    }
    const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
    const lockDuration = jobConsumer(log).getLockDurationInMs(queueName)
    consumer[queueName] = new Worker(queueName, (job) => jobConsumer(log).consume(job.id!, queueName, job.data, job.attemptsStarted), {
        connection: createRedisClient(),
        lockDuration: dayjs.duration(lockDuration, 'milliseconds').add(3, 'minutes').asMilliseconds(),
        telemetry: isOtpEnabled ? new BullMQOtel(queueName) : undefined,
        concurrency: 50,
    })

    await consumer[queueName].waitUntilReady()
    return consumer[queueName]
}

