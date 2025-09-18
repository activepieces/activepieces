import { QueueName } from '@activepieces/server-shared'
import { JobData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { system } from '../../helper/system/system'
import { AddJobParams, JobType, QueueManager } from '../queue/queue-manager'
import { ApMemoryQueue } from './ap-memory-queue'

const workerJobsQueue = new ApMemoryQueue<JobData>(system.globalLogger(), QueueName.WORKER_JOBS)

export const memoryQueue = (_log: FastifyBaseLogger): QueueManager => ({
    async setConcurrency(queueName: QueueName, concurrency: number): Promise<void> {
        await workerJobsQueue.setConcurrency(concurrency)
    },
    async removeRepeatingJob({ flowVersionId }): Promise<void> {
        await workerJobsQueue.remove(flowVersionId)
    },
    async init(): Promise<void> {
        // no-op
    },
    async add(params: AddJobParams<JobType>): Promise<void> {
        const { type, data } = params
        switch (type) {
            case JobType.ONE_TIME: {
                workerJobsQueue.add({
                    id: params.id,
                    data,
                })
                break
            }
            case JobType.REPEATING: {
                workerJobsQueue.add({
                    id: nanoid(),
                    data,
                    cronExpression: params.scheduleOptions.cronExpression,
                    cronTimezone: params.scheduleOptions.timezone,
                })
                break
            }
        }
    },
})
