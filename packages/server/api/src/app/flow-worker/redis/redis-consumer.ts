import { flowTimeoutSandbox, JobStatus, QueueName, triggerTimeoutSandbox } from '@activepieces/server-shared'
import { apId, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { Job, Worker } from 'bullmq'
import dayjs from 'dayjs'
import { createRedisClient } from '../../database/redis-connection'
import { ConsumerManager } from '../consumer/consumer-manager'
import { queueHelper } from '../queue/queue-manager'

type ConsumerGroup = Record<string, Worker>
const consumerGroups: Record<string, ConsumerGroup> = {}

const serverId = apId()

export const redisConsumer: ConsumerManager = {
    async poll(groupId, jobType) {
        const worker = await ensureWorkerExists(groupId, jobType)
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
    async update(groupId, { queueName, jobId, status, message }): Promise<void> {
        const worker = await ensureWorkerExists(groupId, queueName)
        const job = await Job.fromId(worker, jobId)
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
        const sharedConsumers = Object.values(QueueName).map((queueName) => ensureWorkerExists(null, queueName))
        await Promise.all(sharedConsumers)
    },
    async close(): Promise<void> {
        const promises = Object.values(consumerGroups).map((consumerGroup) => {
            return Promise.all(Object.values(consumerGroup).map((consumer) => consumer.close()))
        })
        await Promise.all(promises)
    },
}


async function ensureWorkerExists(groupId: string | null, queueName: QueueName): Promise<Worker> {
    const key = groupId ?? 'default'
    if (isNil(consumerGroups[key])) {
        consumerGroups[key] = {}
    }
    if (!isNil(consumerGroups[key][queueName])) {
        return consumerGroups[key][queueName]
    }
    const lockDuration = getLockDurationInMs(queueName)
    const queueAlias = queueHelper.getQueueName(groupId, queueName)
    consumerGroups[key][queueName] = new Worker(queueAlias, null, {
        connection: createRedisClient(),
        lockDuration,
        maxStalledCount: 5,
        drainDelay: 5,
        stalledInterval: 30000,
    })
    await consumerGroups[key][queueName].waitUntilReady()
    await consumerGroups[key][queueName].startStalledCheckTimer()
    return consumerGroups[key][queueName]
}

function getLockDurationInMs(queueName: QueueName): number {
    switch (queueName) {
        case QueueName.WEBHOOK:
            return dayjs.duration(triggerTimeoutSandbox, 'seconds').add(5, 'seconds').asMilliseconds()
        case QueueName.ONE_TIME:
            return dayjs.duration(flowTimeoutSandbox, 'seconds').add(5, 'seconds').asMilliseconds()
        case QueueName.SCHEDULED:
            return dayjs.duration(triggerTimeoutSandbox, 'seconds').add(5, 'seconds').asMilliseconds()
    }
}