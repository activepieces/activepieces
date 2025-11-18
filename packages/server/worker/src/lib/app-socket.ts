import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { emitWithAck as emitWithAckUtil, tryCatch, WebsocketServerEvent, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { io, Socket } from 'socket.io-client'
import { workerMachine } from './utils/machine'

let socket: Socket
let heartbeatInterval: NodeJS.Timeout
let workerToken: string

export const appSocket = (log: FastifyBaseLogger) => ({
    init: async (params: { 
        workerToken: string
        onConnect: (socket: Socket) => Promise<void>
    }): Promise<void> => {
        workerToken = params.workerToken

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
            await params.onConnect(socket)
        })

        socket.io.on('reconnect_attempt', (attempt: number) => {
            log.info({
                message: 'Socket reconnect attempt',
                attempt,
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
    
    emitWithAck: async <T = unknown>(event: string, data: unknown): Promise<T> => {
        const result = await tryCatch(() => {
            return emitWithAckUtil<T>(socket, event, data, {
                timeoutMs: 4000,
                retries: 3,
                retryDelayMs: 2000,
            })
        })

        if (result.error) {
            log.error({
                message: 'Failed to emit event',
                event,
                data,
                error: result.error,
            })
            throw result.error
        }

        return result.data
    },
    
    disconnect: (): void => {
        clearInterval(heartbeatInterval)
        if (socket) {
            socket.disconnect()
        }
    },
})

