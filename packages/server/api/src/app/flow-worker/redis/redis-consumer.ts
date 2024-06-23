import { Job, Worker } from 'bullmq'
import dayjs from 'dayjs'
import { createRedisClient } from '../../database/redis-connection'
import { ConsumerManager } from '../consumer/consumer-manager'
import { JobStatus, QueueName, system, SystemProp } from '@activepieces/server-shared'
import { apId, assertNotNullOrUndefined, isNil } from '@activepieces/shared'

const consumers: Record<string, Worker> = {}
const sandboxTimeout = system.getNumber(SystemProp.SANDBOX_RUN_TIME_SECONDS) ?? 600
const serverId = apId()

export const redisConsumer: ConsumerManager = {
    async poll(jobType) {
        const worker = consumers[jobType]
        assertNotNullOrUndefined(worker, 'Queue not found')
        const job = await worker.getNextJob(serverId)
        if (isNil(job)) {
            return null
        }
        return {
            id: job.id!,
            data: job.data,
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
        const lockDuration =  dayjs.duration(sandboxTimeout, 'seconds').add(5, 'seconds').asMilliseconds()
        for (const queueName of Object.values(QueueName)) {
            consumers[queueName] = new Worker(queueName, null, {
                connection: createRedisClient(),
                lockDuration,
                maxStalledCount: 5,
                drainDelay: 5,
                stalledInterval: 30000,
            })
        }
        await Promise.all(Object.values(consumers).map((consumer) => consumer.waitUntilReady()))
        for (const queueName of Object.values(QueueName)) {
            const worker = consumers[queueName]
            await worker.startStalledCheckTimer()
        }
    },
    async close(): Promise<void> {
        await Promise.all(Object.values(consumers).map((consumer) => consumer.close()))
    },
}
