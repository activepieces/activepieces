import { Job, Worker } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { ConsumerManager } from '../consumer/consumer-manager'
import { JobStatus, logger, QueueName } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'

const consumers: Record<string, Worker> = {}

export const redisConsumer: ConsumerManager = {
    async poll(jobType, token) {
        const queue = consumers[jobType]
        assertNotNullOrUndefined(queue, 'Queue not found')
        const job = await queue.getNextJob(token)
        if (isNil(job)) {
            return null
        }
        return {
            id: job.id!,
            data: job.data,
        }
    },
    async update({ queueName, jobId, status, token, message }): Promise<void> {
        const job = await Job.fromId(consumers[queueName], jobId)
        assertNotNullOrUndefined(job, 'Job not found')

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
        for (const queueName of Object.values(QueueName)) {
            consumers[queueName] = new Worker(queueName, null, {
                connection: createRedisClient(),
            })
        }
        await Promise.all(Object.values(consumers).map((consumer) => consumer.waitUntilReady()))
        logger.info('[redisConsumerManager#init] Redis consumers initialized')
    },
    async close(): Promise<void> {
        await Promise.all(Object.values(consumers).map((consumer) => consumer.close()))
    },
}
