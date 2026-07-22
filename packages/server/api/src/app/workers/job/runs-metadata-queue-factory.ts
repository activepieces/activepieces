import { apId, ApId, tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { FailedStep, FlowRunStatus, RunEnvironment } from '@activepieces/shared'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { DistributedStore } from '../../database/redis/distributed-store-factory'
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

            const cleanedParams = stripToRunsMetadataUpsertData(params)

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

        async addIfNoPendingWrite(params: RunsMetadataUpsertData): Promise<boolean> {
            if (!queueInstance) {
                throw new Error('Runs metadata queue not initialized')
            }
            const queue = queueInstance

            const cleanedParams = stripToRunsMetadataUpsertData(params)
            const key = redisMetadataKey(cleanedParams.id)

            const requestId = apId()
            const written = await distributedStore.mergeIfKeyAbsent(key, {
                ...cleanedParams,
                requestId,
            }, CLAIM_TTL_SECONDS)
            if (!written) {
                return false
            }

            const { error } = await tryCatch(() => queue.add(
                'update-run-metadata',
                { runId: cleanedParams.id, projectId: cleanedParams.projectId },
                { deduplication: { id: cleanedParams.id } },
            ))
            if (error) {
                await distributedStore.deleteKeyIfFieldValueMatches(key, 'requestId', requestId)
                throw error
            }
            return true
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

const CLAIM_TTL_SECONDS = apDayjsDuration(1, 'hour').asSeconds()

const RUNS_METADATA_UPSERT_KEYS: (keyof RunsMetadataUpsertData)[] = [
    'id', 'projectId', 'created', 'flowId', 'flowVersionId', 'environment',
    'triggeredBy', 'startTime', 'finishTime', 'status', 'tags',
    'failedStep', 'stepNameToTest', 'parentRunId', 'failParentOnFailure',
    'logsFileId', 'updated', 'stepsCount', 'requestId',
    'provisionMs', 'bootMs', 'runMs',
]

function stripToRunsMetadataUpsertData(params: RunsMetadataUpsertData): RunsMetadataUpsertData {
    const result: Record<string, unknown> = {}
    for (const key of RUNS_METADATA_UPSERT_KEYS) {
        if (key in params) {
            result[key] = params[key]
        }
    }
    return result as RunsMetadataUpsertData
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
    redisFailedJobRetentionDays: number
    redisFailedJobRetentionMaxCount: number
}

export type RunsMetadataUpsertData = {
    id: string
    projectId: string
    created?: string
    flowId?: string
    flowVersionId?: string
    environment?: RunEnvironment
    triggeredBy?: string
    startTime?: string | null
    finishTime?: string | null
    status?: FlowRunStatus
    tags?: string[]
    failedStep?: FailedStep
    stepNameToTest?: string
    parentRunId?: string
    failParentOnFailure?: boolean
    logsFileId?: string | null
    updated?: string
    stepsCount?: number
    requestId?: string
    // Transient worker-measured phase durations, merged then folded into the `timeline` column. Not persisted directly.
    provisionMs?: number
    bootMs?: number
    runMs?: number
}
