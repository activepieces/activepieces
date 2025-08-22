import { AppSystemProp, QueueName } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { createRedisClient } from '../../database/redis-connection'
import { system } from '../../helper/system/system'
import { ConsumerManager } from '../consumer/types'
import { jobConsumer } from '../consumer/job-consumer'

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
    const lockDuration = getLockDurationInMs(queueName)
    consumer[queueName] = new Worker(queueName, (job) => jobConsumer(log).consume(job.id!, queueName, job.data, job.attemptsStarted), {
        connection: createRedisClient(),
        lockDuration,
        telemetry: isOtpEnabled ? new BullMQOtel(queueName) : undefined,
    })

    await consumer[queueName].waitUntilReady()
    await consumer[queueName].startStalledCheckTimer()
    return consumer[queueName]
}

function getLockDurationInMs(queueName: QueueName): number {
    const triggerTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS)
    const flowTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS)
    const agentTimeoutSandbox = system.getNumberOrThrow(AppSystemProp.AGENT_TIMEOUT_SECONDS)
    switch (queueName) {
        case QueueName.WEBHOOK:
            return dayjs.duration(triggerTimeoutSandbox, 'seconds').add(3, 'minutes').asMilliseconds()
        case QueueName.USERS_INTERACTION:
            return dayjs.duration(flowTimeoutSandbox, 'seconds').add(3, 'minutes').asMilliseconds()
        case QueueName.ONE_TIME:
            return dayjs.duration(flowTimeoutSandbox, 'seconds').add(3, 'minutes').asMilliseconds()
        case QueueName.SCHEDULED:
            return dayjs.duration(triggerTimeoutSandbox, 'seconds').add(3, 'minutes').asMilliseconds()
        case QueueName.AGENTS:
            return dayjs.duration(agentTimeoutSandbox, 'seconds').add(3, 'minutes').asMilliseconds()
    }
}