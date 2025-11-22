import { rejectedPromiseHandler, RunsMetadataQueueConfig, runsMetadataQueueFactory } from '@activepieces/server-shared'
import { WebsocketServerEvent, WorkerSettingsResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appSocket } from './app-socket'
import { registryPieceManager } from './cache/pieces/production/registry-piece-manager'
import { workerCache } from './cache/worker-cache'
import { engineRunner } from './compute'
import { engineRunnerSocket } from './compute/engine-runner-socket'
import { jobQueueWorker } from './consume/job-queue-worker'
import { workerJobRateLimiter } from './consume/worker-job-rate-limiter'
import { workerMachine } from './utils/machine'
import { workerDistributedLock, workerDistributedStore, workerRedisConnections } from './utils/worker-redis'

export const runsMetadataQueue = runsMetadataQueueFactory({
    createRedisConnection: workerRedisConnections.create,
    distributedStore: workerDistributedStore,
})

export const flowWorker = (log: FastifyBaseLogger) => ({
    async init({ workerToken: token }: { workerToken: string }): Promise<void> {
        rejectedPromiseHandler(workerCache(log).deleteStaleCache(), log)
        await engineRunnerSocket(log).init()

        await appSocket(log).init({
            workerToken: token,
            onConnect: async () => {
                const request = await workerMachine.getSystemInfo()
                const response = await appSocket(log).emitWithAck<WorkerSettingsResponse>(WebsocketServerEvent.FETCH_WORKER_SETTINGS, request)
                await workerMachine.init(response, token, log)
                await registryPieceManager(log).warmup()
                await initRunsMetadataQueue(log)
                await workerJobRateLimiter(log).init()
                await jobQueueWorker(log).start(token)

            },
        })
    },

    async close(): Promise<void> {
        await engineRunnerSocket(log).disconnect()
        appSocket(log).disconnect()

        if (runsMetadataQueue.isInitialized()) {
            await runsMetadataQueue.get().close()
        }

        await workerRedisConnections.destroy()
        await workerDistributedLock(log).destroy()

        if (workerMachine.hasSettings()) {
            await engineRunner(log).shutdownAllWorkers()
        }
        await jobQueueWorker(log).close()
        await workerJobRateLimiter(log).close()
    },
})

async function initRunsMetadataQueue(log: FastifyBaseLogger): Promise<void> {
    const settings = workerMachine.getSettings()
    const config: RunsMetadataQueueConfig = {
        isOtelEnabled: settings.OTEL_ENABLED ?? false,
        redisFailedJobRetentionDays: settings.REDIS_FAILED_JOB_RETENTION_DAYS,
        redisFailedJobRetentionMaxCount: settings.REDIS_FAILED_JOB_RETENTION_MAX_COUNT,
    }
    await runsMetadataQueue.init(config)
    log.info({
        message: 'Initialized runs metadata queue for worker',
    }, '[flowWorker#init]')
}