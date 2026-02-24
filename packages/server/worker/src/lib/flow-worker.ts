import { rejectedPromiseHandler, RunsMetadataQueueConfig, runsMetadataQueueFactory } from '@activepieces/server-shared'
import { createSandbox, createSandboxPool, createSandboxWebsocketServer, nsjailProcess, simpleProcess } from '@activepieces/sandbox'
import { ApEnvironment, ExecutionMode, WebsocketServerEvent, WorkerSettingsResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appSocket } from './app-socket'
import { devPiecesState } from './cache/pieces/development/dev-pieces-state'
import { registryPieceManager } from './cache/pieces/production/registry-piece-manager'
import { ENGINE_PATH, GLOBAL_CODE_CACHE_PATH, workerCache } from './cache/worker-cache'
import { jobQueueWorker } from './consume/job-queue-worker'
import { createSandboxEventHandler } from './execution/sandbox-event-handlers'
import { workerMachine } from './utils/machine'
import { workerDistributedLock, workerDistributedStore, workerRedisConnections } from './utils/worker-redis'

export const runsMetadataQueue = runsMetadataQueueFactory({
    createRedisConnection: workerRedisConnections.create,
    distributedStore: workerDistributedStore,
})

export const sandboxWebsocketServer = createSandboxWebsocketServer()

export const sandboxPool = createSandboxPool((_factoryLog, sandboxId) => {
    const log = _factoryLog as FastifyBaseLogger
    const workerSettings = workerMachine.getSettings()
    const executionMode = workerSettings.EXECUTION_MODE as ExecutionMode
    const sandboxMemoryLimit = Math.floor(parseInt(workerSettings.SANDBOX_MEMORY_LIMIT) / 1024)
    const allowedEnvVariables = workerSettings.SANDBOX_PROPAGATED_ENV_VARS
    const propagatedEnvVars = Object.fromEntries(allowedEnvVariables.map((envVar) => [envVar, process.env[envVar]]))

    const processMaker = executionMode === ExecutionMode.UNSANDBOXED || executionMode === ExecutionMode.SANDBOX_CODE_ONLY
        ? simpleProcess(ENGINE_PATH, GLOBAL_CODE_CACHE_PATH)
        : nsjailProcess(log)

    return createSandbox(log, sandboxId, {
        env: {
            ...propagatedEnvVars,
            NODE_OPTIONS: '--enable-source-maps',
            AP_PAUSED_FLOW_TIMEOUT_DAYS: workerSettings.PAUSED_FLOW_TIMEOUT_DAYS.toString(),
            AP_EXECUTION_MODE: workerSettings.EXECUTION_MODE,
            AP_DEV_PIECES: workerSettings.DEV_PIECES.join(','),
            AP_MAX_FILE_SIZE_MB: workerSettings.MAX_FILE_SIZE_MB.toString(),
            AP_MAX_FLOW_RUN_LOG_SIZE_MB: workerSettings.MAX_FLOW_RUN_LOG_SIZE_MB.toString(),
            AP_FILE_STORAGE_LOCATION: workerSettings.FILE_STORAGE_LOCATION,
            AP_S3_USE_SIGNED_URLS: workerSettings.S3_USE_SIGNED_URLS,
        },
        memoryLimitMb: sandboxMemoryLimit,
        cpuMsPerSec: 1000,
        timeLimitSeconds: 600,
        reusable: canReuseWorkers(),
    }, processMaker, sandboxWebsocketServer, createSandboxEventHandler(log))
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
                sandboxPool.init(log, {
                    concurrency: workerMachine.getSettings().WORKER_CONCURRENCY,
                    reusable: canReuseWorkers(),
                    getGeneration: () => devPiecesState.getGeneration(),
                })
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

function canReuseWorkers(): boolean {
    const settings = workerMachine.getSettings()
    if (settings.ENVIRONMENT === ApEnvironment.DEVELOPMENT) {
        return true
    }
    const trustedModes = [ExecutionMode.SANDBOX_CODE_ONLY, ExecutionMode.UNSANDBOXED]
    if (trustedModes.includes(settings.EXECUTION_MODE as ExecutionMode)) {
        return true
    }
    if (workerMachine.isDedicatedWorker()) {
        return true
    }
    return false
}

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
