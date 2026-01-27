import { rejectedPromiseHandler, RunsMetadataQueueConfig, runsMetadataQueueFactory } from '@activepieces/server-shared'
import { WebsocketServerEvent, WorkerSettingsResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appSocket } from './app-socket'
import { registryPieceManager } from './cache/pieces/production/registry-piece-manager'
import { workerCache } from './cache/worker-cache'
import { sandboxPool } from './compute/sandbox/sandbox-pool'
import { sandboxWebsocketServer } from './compute/sandbox/websocket-server'
import { jobQueueWorker } from './consume/job-queue-worker'
import { workerMachine } from './utils/machine'
import { workerDistributedLock, workerDistributedStore, workerRedisConnections } from './utils/worker-redis'

export const runsMetadataQueue = runsMetadataQueueFactory({ 
    createRedisConnection: workerRedisConnections.create,
    distributedStore: workerDistributedStore,
})

export const flowWorker = (log: FastifyBaseLogger) => ({
    async init({ workerToken: token, markAsHealthy }: FlowWorkerInitParams): Promise<void> {
        rejectedPromiseHandler(workerCache(log).deleteStaleCache(), log)

        sandboxWebsocketServer.init(log)

        await appSocket(log).init({
            workerToken: token,
            onConnect: async () => {
                const request = await workerMachine.getSystemInfo(log)
                const response = await appSocket(log).emitWithAck<WorkerSettingsResponse>(WebsocketServerEvent.FETCH_WORKER_SETTINGS, request)
                await workerMachine.init(response, token, log)
                sandboxPool.init(log)
                await registryPieceManager(log).warmup()
                await jobQueueWorker(log).start()
                await initRunsMetadataQueue(log)
                await markAsHealthy()
                await registryPieceManager(log).distributedWarmup()
            },
        })
    },

    async close(): Promise<void> {
        await sandboxPool.drain()
        await sandboxWebsocketServer.shutdown()
        appSocket(log).disconnect()

        if (runsMetadataQueue.isInitialized()) {
            await runsMetadataQueue.get().close()
        }

        await workerRedisConnections.destroy()
        await workerDistributedLock(log).destroy()
        
        await jobQueueWorker(log).close()
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

type FlowWorkerInitParams = {
    workerToken: string
    markAsHealthy: () => Promise<void>
}