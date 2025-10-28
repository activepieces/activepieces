import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { WebsocketServerEvent, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { io, Socket } from 'socket.io-client'
import { workerCache } from './cache/worker-cache'
import { engineRunner } from './compute'
import { engineRunnerSocket } from './compute/engine-runner-socket'
import { runsMetadataQueue } from './compute/flow-runs-queue'
import { jobQueueWorker } from './consume/job-queue-worker'
import { workerMachine } from './utils/machine'
import { workerDistributedLock, workerRedisConnections } from './utils/worker-redis'

let workerToken: string
let heartbeatInterval: NodeJS.Timeout
let socket: Socket

export const workerSocket = (log: FastifyBaseLogger) => ({
    emitWithAck: async (event: string, data: unknown, options?: { timeoutMs?: number, retries?: number, retryDelayMs?: number }): Promise<void> => {
        const timeoutMs = options?.timeoutMs ?? 10000
        const retries = options?.retries ?? 3
        const retryDelayMs = options?.retryDelayMs ?? 2000

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (!socket || !socket.connected) {
                    throw new Error('Socket not connected')
                }
                await socket.timeout(timeoutMs).emitWithAck(event, data)
                return
            }
            catch (error) {
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelayMs))
                }
                else {
                    log.error({
                        message: 'Failed to emit event',
                        event,
                        data,
                        error,
                    })
                }
            }
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
            await runsMetadataQueue(log).init()
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

        await workerRedisConnections.destroy()
        await workerDistributedLock(log).destroy()
        clearTimeout(heartbeatInterval)
        if (workerMachine.hasSettings()) {
            await engineRunner(log).shutdownAllWorkers()
        }
        await jobQueueWorker(log).close()
    },
})

