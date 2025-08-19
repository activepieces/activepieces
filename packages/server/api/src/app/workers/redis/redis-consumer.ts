import { AppSystemProp, exceptionHandler, JobStatus, memoryLock, QueueName, rejectedPromiseHandler } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { Job, Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { createRedisClient } from '../../database/redis-connection'
import { system } from '../../helper/system/system'
import { ConsumerManager } from '../consumer/consumer-manager'
import { redisRateLimiter } from './redis-rate-limiter'

const consumer: Record<string, Worker> = {}


export const redisConsumer = (log: FastifyBaseLogger): ConsumerManager => ({
    async poll(jobType, { token }) {
        let lock
        try {
            lock = await memoryLock.acquire(`poll-${jobType}`, 15000)
            const worker = await ensureWorkerExists(jobType)
            assertNotNullOrUndefined(worker, 'Queue not found')
            // The worker.getNextJob() method holds the connection until a job is available, but it can only be called once at a time.
            // To handle multiple workers, we are storing them in memory while waiting for a job to become available.
            const job = await worker.getNextJob(token)
            if (isNil(job)) {
                return null
            }
            return {
                id: job.id!,
                data: job.data,
                attempsStarted: job.attemptsStarted,
            }
        }
        catch (e) {
            if (memoryLock.isTimeoutError(e)) {
                return null
            }
            exceptionHandler.handle(e, log)
            throw e
        }
        finally {
            if (lock) {
                await lock.release()
            }
        }
    },
    async update({ queueName, jobId, status, message, token }): Promise<void> {
        const worker = await ensureWorkerExists(queueName)
        const job = await Job.fromId(worker, jobId)
        assertNotNullOrUndefined(job, 'Job not found')
        assertNotNullOrUndefined(token, 'Token not found')
        rejectedPromiseHandler(redisRateLimiter(log).onCompleteOrFailedJob(queueName, job), log)
        switch (status) {
            case JobStatus.COMPLETED:
                await job.moveToCompleted({}, token, false)
                break
            case JobStatus.FAILED:
                await job.moveToFailed(new Error(message), token, false)
                break
        }
    },
    async init(): Promise<void> {
        const sharedConsumers = Object.values(QueueName).map((queueName) => ensureWorkerExists(queueName))
        await Promise.all(sharedConsumers)
    },
    async close(): Promise<void> {
        const promises = Object.values(consumer).map(consumer => consumer.close())
        await Promise.all(promises)
    },
})


async function ensureWorkerExists(queueName: QueueName): Promise<Worker> {
    if (!isNil(consumer[queueName])) {
        return consumer[queueName]
    }
    const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
    const lockDuration = getLockDurationInMs(queueName)
    consumer[queueName] = new Worker(queueName, null, {
        connection: createRedisClient(),
        lockDuration,
        maxStalledCount: 5,
        drainDelay: 5,
        stalledInterval: 30000,
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