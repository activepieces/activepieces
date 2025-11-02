import { rejectedPromiseHandler, RunsMetadataQueueConfig, runsMetadataQueueFactory } from '@activepieces/server-shared'
import { WebsocketServerEvent, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { io, Socket } from 'socket.io-client'
import { workerCache } from './cache/worker-cache'
import { engineRunner } from './compute'
import { engineRunnerSocket } from './compute/engine-runner-socket'
import { jobQueueWorker } from './consume/job-queue-worker'
import { workerMachine } from './utils/machine'
import { workerDistributedLock, workerDistributedStore, workerRedisConnections } from './utils/worker-redis'

let workerToken: string
let heartbeatInterval: NodeJS.Timeout
let socket: Socket

export const runsMetadataQueue = runsMetadataQueueFactory({ 
    createRedisConnection: workerRedisConnections.create,
    distributedStore: workerDistributedStore,
})

export const workerSocket = (log: FastifyBaseLogger) => ({
    emit: (event: string, data: unknown): void => {
        try {
            socket?.emit(event, data)
        }
        catch (error) {
            log.error({
                message: 'Failed to emit event',
                event,
                data,
                error,
            })
            throw error
        }
    },
    isConnected: (): boolean => {
        return socket?.connected ?? false
    },
})

export const flowWorker = (log: FastifyBaseLogger): {
    init: (params: { workerToken: string }) => Promise<void>
    close: () => Promise<void>
} => ({
    async init({ workerToken: token }: { workerToken: string }): Promise<void> {
        rejectedPromiseHandler(workerCache(log).deleteStaleCache(), log)
        await engineRunnerSocket(log).init()

        workerToken = token

        const { url, path } = workerMachine.getSocketUrlAndPath()
        socket = io(url, {
            transports: ['websocket'],
            path,
            autoConnect: false,
            reconnection: true,
            ackTimeout: 4000,
            retries: 3,
        })

        socket.auth = {
            token: workerToken,
            workerId: workerMachine.getWorkerId(),
            platformIdForDedicatedWorker: workerMachine.getPlatformIdForDedicatedWorker(),
        }

        socket.on('connect', async () => {
            log.info({
                message: 'Connected to server',
                workerId: workerMachine.getWorkerId(),
                socketId: socket.id,
            })
            const request: WorkerMachineHealthcheckRequest = await workerMachine.getSystemInfo()
            const response = await socket.timeout(10000).emitWithAck(WebsocketServerEvent.FETCH_WORKER_SETTINGS, request)
            await workerMachine.init(response, log)
            await jobQueueWorker(log).start(workerToken)
            await initRunsMetadataQueue(log)
        })

        socket.on('disconnect', async () => {
            await jobQueueWorker(log).pause()
            log.info({
                message: 'Disconnected from server',
            })
        })

        socket.on('connect_error', (error) => {
            log.error({
                message: 'Socket connection error',
                error: error.message,
            })
        })

        socket.on('error', (error) => {
            log.error({
                message: 'Socket error',
                error: error.message,
            })
        })

        socket.connect()

        heartbeatInterval = setInterval(() => {
            rejectedPromiseHandler((async (): Promise<void> => {
                if (!socket.connected) {
                    log.error({
                        message: 'Not connected to server, retrying...',
                    })
                    return
                }
                try {
                    const request: WorkerMachineHealthcheckRequest = await workerMachine.getSystemInfo()
                    socket.emit(WebsocketServerEvent.WORKER_HEALTHCHECK, request)
                }
                catch (error) {
                    log.error({
                        message: 'Failed to send heartbeat, retrying...',
                        error,
                    })
                }
            })(), log)
        }, 15000)
    },

    async close(): Promise<void> {
        await engineRunnerSocket(log).disconnect()

        if (socket) {
            socket.disconnect()
        }

        if (runsMetadataQueue.get()) {
            await runsMetadataQueue.get().close()
        }

        await workerRedisConnections.destroy()
        await workerDistributedLock(log).destroy()
        clearTimeout(heartbeatInterval)
        if (workerMachine.hasSettings()) {
            await engineRunner(log).shutdownAllWorkers()
        }
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
