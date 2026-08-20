import { apDayjsDuration } from '@activepieces/server-utils'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { QueueName } from '../workers/job'

export const evaluationDeduplicationId = (barrierId: string): string => `evaluate-${barrierId}`

export const barrierQueueFactory = ({ createRedisConnection }: BarrierQueueFactoryParams) => {
    let queueInstance: Queue<BarrierJobData> | undefined = undefined

    const requireQueue = (): Queue<BarrierJobData> => {
        if (!queueInstance) {
            throw new Error('Barrier queue not initialized')
        }
        return queueInstance
    }

    return {
        async init(config: BarrierQueueConfig): Promise<void> {
            queueInstance = new Queue<BarrierJobData>(QueueName.BARRIER_JOBS, {
                connection: await createRedisConnection(),
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: apDayjsDuration(8, 'minute').asMilliseconds(),
                    },
                    removeOnComplete: true,
                    removeOnFail: {
                        age: apDayjsDuration(config.redisFailedJobRetentionDays, 'day').asSeconds(),
                        count: config.redisFailedJobRetentionMaxCount,
                    },
                },
            })
            await queueInstance.waitUntilReady()
        },

        async addEvaluation(params: BarrierJobData): Promise<void> {
            await requireQueue().add(BarrierJobName.EVALUATE, params, {
                deduplication: { id: evaluationDeduplicationId(params.barrierId) },
            })
        },

        async clearEvaluationDeduplication(barrierId: string): Promise<void> {
            await requireQueue().removeDeduplicationKey(evaluationDeduplicationId(barrierId))
        },

        get(): Queue<BarrierJobData> {
            return requireQueue()
        },

        isInitialized(): boolean {
            return queueInstance !== undefined
        },
    }
}

export enum BarrierJobName {
    EVALUATE = 'evaluate-barrier',
}

export type BarrierJobData = {
    barrierId: string
    projectId: string
}

export type BarrierQueueConfig = {
    redisFailedJobRetentionDays: number
    redisFailedJobRetentionMaxCount: number
}

type BarrierQueueFactoryParams = {
    createRedisConnection: () => Promise<Redis>
}
