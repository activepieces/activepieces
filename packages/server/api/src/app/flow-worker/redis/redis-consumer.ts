import { exceptionHandler, flowTimeoutSandbox, JobStatus, memoryLock, QueueName, system, SystemProp, triggerTimeoutSandbox } from '@activepieces/server-shared'
import { apId, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { Job, Worker } from 'bullmq'
import dayjs from 'dayjs'
import { createRedisClient } from '../../database/redis-connection'
import { ConsumerManager } from '../consumer/consumer-manager'

const consumers: Record<string, Worker> = {}
const serverId = apId()
const WORKER_CONCURRENCY = system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10

export const redisConsumer: ConsumerManager = {
    async poll(jobType) {
        let lock
        try {
            lock = await memoryLock.acquire(`poll-${jobType}`, 5000)
            const worker = consumers[jobType]
            assertNotNullOrUndefined(worker, 'Queue not found')
            // The worker.getNextJob() method holds the connection until a job is available, but it can only be called once at a time.
            // To handle multiple workers, we are storing them in memory while waiting for a job to become available.
            const job = await worker.getNextJob(serverId)
            if (isNil(job)) {
                return null
            }
            return {
                id: job.id!,
                data: job.data,
            }
        }
        catch (e) {
            if (memoryLock.isTimeoutError(e)) {
                return null
            }
            exceptionHandler.handle(e)
            throw e
        }
        finally {
            if (lock) {
                await lock.release()
            }
        }
    },
    async update({ queueName, jobId, status, message }): Promise<void> {
        const job = await Job.fromId(consumers[queueName], jobId)
        assertNotNullOrUndefined(job, 'Job not found')

        switch (status) {
            case JobStatus.COMPLETED:
                await job.moveToCompleted({}, serverId, false)
                break
            case JobStatus.FAILED:
                await job.moveToFailed(new Error(message), serverId, false)
                break
        }
    },
    async init(): Promise<void> {
        if (WORKER_CONCURRENCY === 0) {
            return
        }
        for (const queueName of Object.values(QueueName)) {
            const lockDuration = getLockDurationInMs(queueName)
            consumers[queueName] = new Worker(queueName, null, {
                connection: createRedisClient(),
                lockDuration,
                maxStalledCount: 5,
                stalledInterval: 30000,
            })
        }
        await Promise.all(Object.values(consumers).map((consumer) => consumer.waitUntilReady()))

    },
    async close(): Promise<void> {
        if (WORKER_CONCURRENCY === 0) {
            return
        }
        await Promise.all(Object.values(consumers).map((consumer) => consumer.close()))
    },
}


function getLockDurationInMs(queueName: QueueName) {
    switch (queueName) {
        case QueueName.WEBHOOK:
            return dayjs.duration(triggerTimeoutSandbox, 'seconds').add(5, 'seconds').asMilliseconds()
        case QueueName.ONE_TIME:
            return dayjs.duration(flowTimeoutSandbox, 'seconds').add(5, 'seconds').asMilliseconds()
        case QueueName.SCHEDULED:
            return dayjs.duration(triggerTimeoutSandbox, 'seconds').add(5, 'seconds').asMilliseconds()
    }
}