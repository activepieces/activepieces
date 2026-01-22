import { apId, ApId, FlowRun as FlowRunSchema } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import Redis from 'ioredis'
import { apDayjsDuration } from '../dayjs-helper'
import { DistributedStore } from '../redis/distributed-store-factory'
import { QueueName } from './index'

export const redisMetadataKey = (runId: ApId): string => `runs_metadata:${runId}`

export const runsMetadataQueueFactory = ({
    createRedisConnection,
    distributedStore,
}: RunsMetadataQueueFactoryParams) => {
    let queueInstance: Queue<RunsMetadataJobData> | undefined = undefined

    return {
        async init(config: RunsMetadataQueueConfig): Promise<void> {
            queueInstance = new Queue<RunsMetadataJobData>(QueueName.RUNS_METADATA, {
                connection: await createRedisConnection(),
                telemetry: config.isOtelEnabled ? new BullMQOtel(QueueName.RUNS_METADATA) : undefined,
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

            const cleanedParams = Value.Clean(RunsMetadataUpsertData, params) as RunsMetadataUpsertData

            await distributedStore.merge(redisMetadataKey(cleanedParams.id), {
                ...cleanedParams,
                requestId: apId(),
            })

            await queueInstance.add(
                'update-run-metadata',
                { runId: cleanedParams.id, projectId: cleanedParams.projectId },
                { deduplication: { id: cleanedParams.id } },
            )
        },

        get(): Queue<RunsMetadataJobData> {
            if (!queueInstance) {
                throw new Error('Runs metadata queue not initialized')
            }
            return queueInstance
        },

        isInitialized(): boolean {
            return queueInstance !== undefined
        },
    }
}

type RunsMetadataQueueFactoryParams = {
    createRedisConnection: () => Promise<Redis>
    distributedStore: DistributedStore
}

export type RunsMetadataJobData = {
    runId: string
    projectId: string
}

export type RunsMetadataQueueConfig = {
    isOtelEnabled: boolean
    redisFailedJobRetentionDays: number
    redisFailedJobRetentionMaxCount: number
}

export const RunsMetadataUpsertData = Type.Composite([
    Type.Required(Type.Pick(FlowRunSchema, ['id', 'projectId'])),
    Type.Partial(Type.Pick(FlowRunSchema, [
        'flowId',
        'flowVersionId',
        'environment',
        'triggeredBy',
        'startTime',
        'finishTime',
        'status',
        'tags',
        'pauseMetadata',
        'failedStep',
        'stepNameToTest',
        'parentRunId',
        'failParentOnFailure',
        'logsFileId',
        'updated',
        'stepsCount',
    ])),
    Type.Object({
        requestId: Type.Optional(Type.String()),
    }),
])

export type RunsMetadataUpsertData = Static<typeof RunsMetadataUpsertData>
