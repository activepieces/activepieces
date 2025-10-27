import { RunsMetadataJobData, RunsMetadataQueueConfig, runsMetadataQueueFactory, RunsMetadataUpsertData } from '@activepieces/server-shared'
import { Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'
import { workerDistributedStore, workerRedisConnections } from '../utils/worker-redis'

const queue = runsMetadataQueueFactory({ 
    createRedisConnection: workerRedisConnections.create,
    distributedStore: workerDistributedStore,
})

export const runsMetadataQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const isOtelEnabled = workerMachine.getSettings().OTEL_ENABLED ?? false

        const config: RunsMetadataQueueConfig = {
            isOtelEnabled,
            redisFailedJobRetentionDays: 7, // Default value, adjust as needed
            redisFailedJobRetentionMaxCount: 1000, // Default value, adjust as needed
        }
        await queue.init(config)
        log.info('[runsMetadataQueue#init] Initialized runs metadata queue')
    },

    async add(params: RunsMetadataUpsertData): Promise<void> {
        log.info({
            runId: params.id,
            projectId: params.projectId,
        }, '[runsMetadataQueue#add] Adding runs metadata to queue')
        await queue.add(params)
    },

    get(): Queue<RunsMetadataJobData> {
        return queue.get()
    },

    async close(): Promise<void> {
        if (queue.get()) {
            await queue.get().close()
        }
    },
})

