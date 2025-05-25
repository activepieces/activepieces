import { assertNotNullOrUndefined, EngineError, EngineResult, EngineSocketEvent, EngineStderr, EngineStdout, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Server, Socket } from 'socket.io'

let io: Server | null = null
const sockets: Record<string, Socket> = {}
const resolvePromises: Record<string, (value: boolean) => void> = {}

export const engineRunnerSocket = (log: FastifyBaseLogger) => {
    return {
        async init(): Promise<void> {
            try {
                io = new Server(12345, {
                    path: '/worker/ws',
                    cors: {
                        origin: '*',
                    },
                })

                io.on('connection', (socket) => {
                    const workerId = socket.handshake.headers['worker-id'] as string
                    log.info('Client connected to engine socket server ' + workerId)

                    // Clean up any existing socket for this workerId
                    if (sockets[workerId]) {
                        this.cleanupSocket(workerId)
                    }

                    sockets[workerId] = socket

                    if (!isNil(resolvePromises[workerId])) {
                        resolvePromises[workerId](true)
                        delete resolvePromises[workerId]
                    }

                    socket.on('disconnect', () => {
                        log.info({ workerId }, 'Client disconnected from engine socket server')
                        this.cleanupSocket(workerId)
                    })

                    // Handle errors
                    socket.on('error', (error) => {
                        log.error({ error, workerId }, 'Socket error occurred')
                        this.cleanupSocket(workerId)
                    })
                })

                process.on('SIGTERM', async () => {
                    await this.disconnect()
                })

                process.on('SIGINT', async () => {
                    await this.disconnect()
                })
            }
            catch (error) {
                log.error({ error }, 'Failed to initialize socket server')
                throw error
            }
        },

        cleanupSocket(workerId: string): void {
            const socket = sockets[workerId]
            if (socket) {
                socket.removeAllListeners()
                socket.disconnect(true)
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

                resolvePromises[workerId] = (value: boolean) => {
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

        subscribe(
            workerId: string,
            onResult: (result: EngineResult) => void,
            onError: (error: EngineError) => void,
            onStdout: (stdout: EngineStdout) => void,
            onStderr: (stderr: EngineStderr) => void,
        ): void {
            const socket = sockets[workerId]
            assertNotNullOrUndefined(socket, 'sockets[workerId]')

            // Remove any existing listeners before adding new ones
            this.unsubscribe(workerId)

            socket.on(EngineSocketEvent.ENGINE_RESULT, onResult)
            socket.on(EngineSocketEvent.ENGINE_ERROR, onError)
            socket.on(EngineSocketEvent.ENGINE_STDOUT, onStdout)
            socket.on(EngineSocketEvent.ENGINE_STDERR, onStderr)
        },

        unsubscribe(workerId: string): void {
            const socket = sockets[workerId]
            if (socket) {
                socket.removeAllListeners(EngineSocketEvent.ENGINE_RESULT)
                socket.removeAllListeners(EngineSocketEvent.ENGINE_ERROR)
                socket.removeAllListeners(EngineSocketEvent.ENGINE_STDOUT)
                socket.removeAllListeners(EngineSocketEvent.ENGINE_STDERR)
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