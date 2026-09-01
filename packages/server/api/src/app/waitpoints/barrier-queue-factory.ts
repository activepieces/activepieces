import { apDayjsDuration } from '@activepieces/server-utils'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { QueueName } from '../workers/job'

export const barrierSourceKey = (barrierId: string): string => `barrier_source:${barrierId}`

export const evaluationDedupKey = (barrierId: string): string => `evaluate-${barrierId}`

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
            queueInstance = new Queue<BarrierJobData>(QueueName.BARRIER_EVALUATION, {
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

        async enqueueEvaluation(params: BarrierJobData): Promise<void> {
            await requireQueue().add(BarrierJobName.EVALUATE, params, {
                deduplication: { id: evaluationDedupKey(params.barrierId) },
            })
        },

        async addFanOutDispatch(params: BarrierJobData): Promise<void> {
            await requireQueue().add(BarrierJobName.FAN_OUT_DISPATCH, params, {
                jobId: `dispatch-${params.barrierId}`,
            })
        },

        async clearEvaluationDedupKey(barrierId: string): Promise<void> {
            await requireQueue().removeDeduplicationKey(evaluationDedupKey(barrierId))
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
    FAN_OUT_DISPATCH = 'fan-out-dispatch',
}

export type BarrierJobData = {
    barrierId: string
    projectId: string
}

export type BarrierQueueConfig = {
    redisFailedJobRetentionDays: number
    redisFailedJobRetentionMaxCount: number
}

export type BarrierFanOutPayload = {
    entryStepName: string
    seedSteps: Record<string, unknown>
    batches: unknown[][]
}

type BarrierQueueFactoryParams = {
    createRedisConnection: () => Promise<Redis>
}
