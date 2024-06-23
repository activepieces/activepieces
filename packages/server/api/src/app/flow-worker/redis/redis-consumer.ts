import { Job, Worker } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { ConsumerManager } from '../consumer/consumer-manager'
import { JobStatus, logger, QueueName, system, SystemProp } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import dayjs from 'dayjs'

const consumers: Record<string, Worker> = {}
const sandboxTimeout = system.getNumber(SystemProp.SANDBOX_RUN_TIME_SECONDS) ?? 6000

export const redisConsumer: ConsumerManager = {
    async poll(jobType) {
        const queue = consumers[jobType]
        assertNotNullOrUndefined(queue, 'Queue not found')
        const job = await queue.getNextJob('STATIC_TOKEN')
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
                await job.moveToCompleted({}, 'STATIC_TOKEN', false)
                break
            case JobStatus.FAILED:
                await job.moveToFailed(new Error(message), 'STATIC_TOKEN', false)
                break
        }
    },
    async init(): Promise<void> {
        for (const queueName of Object.values(QueueName)) {
            consumers[queueName] = new Worker(queueName, null, {
                connection: createRedisClient(),
                lockDuration: dayjs.duration(sandboxTimeout).add(5, 'seconds').milliseconds(),
            })
        }
        await Promise.all(Object.values(consumers).map((consumer) => consumer.waitUntilReady()))
        logger.info('[redisConsumerManager#init] Redis consumers initialized')
    },
    async close(): Promise<void> {
        await Promise.all(Object.values(consumers).map((consumer) => consumer.close()))
    },
}
