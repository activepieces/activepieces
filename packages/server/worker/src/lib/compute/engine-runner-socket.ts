import { assertNotNullOrUndefined, EngineResponse, EngineSocketEvent, EngineStderr, EngineStdout, isNil, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { type Socket, Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null
const sockets: Record<string, Socket> = {}
const resolvePromises: Record<string, (value: boolean) => void> = {}


export const engineRunnerSocket = (log: FastifyBaseLogger) => {
    return {
        async init(): Promise<void> {
            try {
                io = new SocketIOServer({
                    path: '/worker/ws',
                    maxHttpBufferSize: 1e8,
                })

                io.listen(12345)

                io.on('connection', (socket: Socket) => {
                    const workerId = socket.handshake.auth['workerId'] as string
                    log.info('Client connected to engine socket server ' + workerId)

                    // Clean up any existing socket for this workerId
                    if (sockets[workerId]) {
                        this.cleanupSocket(workerId)
                    }

                    sockets[workerId] = socket

                    if (!isNil(resolvePromises[workerId])) {
                        resolvePromises[workerId](true)
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete resolvePromises[workerId]
                    }

                    socket.on('disconnect', () => {
                        log.info({ workerId }, 'Client disconnected from engine socket server')
                        this.cleanupSocket(workerId)
                    })

                    socket.on('error', (error) => {
                        log.error({ error, workerId }, 'Socket error occurred')
                        this.cleanupSocket(workerId)
                    })
                })

                process.on('SIGTERM', () => {
                    void this.disconnect()
                })

                process.on('SIGINT', () => {
                    void this.disconnect()
                })
            }
            catch (error) {
                log.error({ error }, 'Failed to initialize socket server')
                throw error
            }
        },
        isConnected(workerId: string): boolean {
            const socket = sockets[workerId]
            return !isNil(socket) && socket.connected
        },

        cleanupSocket(workerId: string): void {
            const socket = sockets[workerId]
            if (socket) {
                socket.removeAllListeners()
                socket.disconnect()
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete sockets[workerId]
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete resolvePromises[workerId]
            }
        },

        async waitForConnect(workerId: string): Promise<boolean> {
            if (!isNil(sockets[workerId])) {
                return sockets[workerId].connected
            }

            const promise = new Promise<boolean>((resolve) => {
                const timeout = setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete resolvePromises[workerId]
                    resolve(false)
                }, 30000)

                resolvePromises[workerId] = (value: boolean): void => {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete resolvePromises[workerId]
                    clearTimeout(timeout)
                    resolve(value)
                }
            })
            return promise
        },

        send(workerId: string, message: unknown): void {
            const socket = sockets[workerId]
            assertNotNullOrUndefined(socket, 'socket')
            if (!socket.connected) {
                throw new Error(`Socket for worker ${workerId} is not connected`)
            }
            socket.emit(EngineSocketEvent.ENGINE_OPERATION, message)
        },

        subscribe({
            workerId,
            onResult,
            onStdout,
            onStderr,
            updateRunProgress,
            updateStepProgress,
            sendFlowResponse,
        }: {
            workerId: string
            onResult: (result: EngineResponse<unknown>) => void
            onStdout: (stdout: EngineStdout) => void
            onStderr: (stderr: EngineStderr) => void
            updateRunProgress: (data: UpdateRunProgressRequest, log: FastifyBaseLogger) => Promise<void>
            updateStepProgress: (data: UpdateStepProgressRequest, log: FastifyBaseLogger) => Promise<void>
            sendFlowResponse: (data: SendFlowResponseRequest, log: FastifyBaseLogger) => Promise<void>
        }): void {
            const socket = sockets[workerId]
            assertNotNullOrUndefined(socket, 'sockets[workerId]')

            // Remove any existing listeners before adding new ones
            this.unsubscribe(workerId)

            socket.on(EngineSocketEvent.ENGINE_RESPONSE, (data: EngineResponse<unknown>, callback: () => void) => {
                onResult(data)
                callback?.()
            })

            socket.on(EngineSocketEvent.ENGINE_STDOUT, (data: EngineStdout) => {
                onStdout(data)
            })

            socket.on(EngineSocketEvent.ENGINE_STDERR, (data: EngineStderr, callback: () => void) => {
                onStderr(data)
                callback?.()
            })

            socket.on(EngineSocketEvent.UPDATE_RUN_PROGRESS, async (data: UpdateRunProgressRequest, callback: () => void) => {
                await updateRunProgress(data, log)
                callback()
            })
            
            socket.on(EngineSocketEvent.UPDATE_STEP_PROGRESS, async (data: UpdateStepProgressRequest, callback: () => void) => {
                await updateStepProgress(data, log)
                callback()
            })

            socket.on(EngineSocketEvent.SEND_FLOW_RESPONSE, async (data: SendFlowResponseRequest, callback: () => void) => {
                await sendFlowResponse(data, log)
                callback()
            })
        },

        unsubscribe(workerId: string): void {
            const socket = sockets[workerId]
            if (socket) {
                socket.removeAllListeners(EngineSocketEvent.ENGINE_RESPONSE)
                socket.removeAllListeners(EngineSocketEvent.ENGINE_STDOUT)
                socket.removeAllListeners(EngineSocketEvent.ENGINE_STDERR)
                socket.removeAllListeners(EngineSocketEvent.UPDATE_RUN_PROGRESS)
                socket.removeAllListeners(EngineSocketEvent.UPDATE_STEP_PROGRESS)
                socket.removeAllListeners(EngineSocketEvent.SEND_FLOW_RESPONSE)
            }
        },

        async disconnect(): Promise<void> {
            if (io) {
                // Clean up all sockets
                Object.keys(sockets).forEach(workerId => {
                    this.cleanupSocket(workerId)
                })
                await io.close()
                io = null
            }
        },
    }
}