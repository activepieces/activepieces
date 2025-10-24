import { ApId, FlowRun, ProjectId } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import Redis from 'ioredis'
import { apDayjsDuration } from '../dayjs-helper'
import { DistributedStore } from '../redis/distributed-store-factory'

const QUEUE_NAME = 'runsMetadata'

export const redisMetadataKey = (runId: ApId): string => `runs_metadata:${runId}`

export type RunsMetadataQueueConfig = {
    isOtelEnabled: boolean
    redisFailedJobRetentionDays: number
    redisFailedJobRetentionMaxCount: number
}

export const runsMetadataQueueFactory = ({
    createRedisConnection,
    distributedStore,
}: RunsMetadataQueueFactoryParams) => {
    let queueInstance: Queue<RunsMetadataJobData> | undefined = undefined

    return {
        async init(config: RunsMetadataQueueConfig): Promise<void> {
            queueInstance = new Queue<RunsMetadataJobData>(QUEUE_NAME, {
                connection: await createRedisConnection(),
                telemetry: config.isOtelEnabled ? new BullMQOtel(QUEUE_NAME) : undefined,
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

        async add(params: RunsMetadataUpsertData): Promise<void> {
            if (!queueInstance) {
                throw new Error('Runs metadata queue not initialized')
            }

            await distributedStore.merge(redisMetadataKey(params.id), params)

            await queueInstance.add(
                'update-run-metadata',
                { runId: params.id, projectId: params.projectId },
                { deduplication: { id: params.id } },
            )
        },

        get(): Queue<RunsMetadataJobData> {
            if (!queueInstance) {
                throw new Error('Runs metadata queue not initialized')
            }
            return queueInstance
        },
    }
}
export type RunsMetadataJobData = {
    runId: string
    projectId: string
}

export type RunsMetadataUpsertData = Partial<FlowRun> & {
    id: ApId
    projectId: ProjectId
}

type RunsMetadataQueueFactoryParams = {
    createRedisConnection: () => Promise<Redis>
    distributedStore: DistributedStore
}