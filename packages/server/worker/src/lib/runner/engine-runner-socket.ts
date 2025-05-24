import { Server } from 'socket.io'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { exceptionHandler } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, EngineError, EngineResult, EngineStderr, EngineStdout } from '@activepieces/shared'
import { EngineSocketEvent } from '@activepieces/shared'
import { isNil } from '@activepieces/shared'

let io: Server | null = null

const sockets: Record<string, any> = {}
const resolvePromises: Record<string, (value: boolean) => void> = {}

export const engineRunnerSocket = (log: FastifyBaseLogger) => {
    return {
        async init(_app: FastifyInstance): Promise<void> {
            try {
                io = new Server(12345, {
                    path: '/worker/ws',
                    cors: {
                        origin: '*',
                    }
                })

                io.on('connection', (socket) => {
                    const workerId = socket.handshake.headers['worker-id'] as string
                    log.info('Client connected to engine socket server ' + workerId)
                    sockets[workerId] = socket

                    if (!isNil(resolvePromises[workerId])) {
                        resolvePromises[workerId](true)
                        delete resolvePromises[workerId]
                    }

                    socket.on('disconnect', () => {
                        log.info({ workerId }, 'Client disconnected from engine socket server')
                        delete sockets[workerId]
                    })
                })
            } catch (error) {
                log.error({ error }, 'Failed to initialize socket server')
                throw error
            }
        },

        async waitForConnect(workerId: string): Promise<boolean> {
            if (!isNil(sockets[workerId])) {
                return true
            }

            const promise = new Promise<boolean>((resolve) => {
                const timeout = setTimeout(() => {
                    delete resolvePromises[workerId]
                    resolve(false)
                }, 30000)

                resolvePromises[workerId] = (value: boolean) => {
                    delete resolvePromises[workerId]
                    clearTimeout(timeout)
                    resolve(value)
                }
            })
            return await promise
        },

        async send(workerId: string, message: unknown): Promise<void> {
            const socket = sockets[workerId]
            assertNotNullOrUndefined(socket, 'socket')
            socket.emit(EngineSocketEvent.ENGINE_OPERATION, message)
        },

        subscribe(
            workerId: string,
            onResult: (result: EngineResult) => void,
            onError: (error: EngineError) => void,
            onStdout: (stdout: EngineStdout) => void,
            onStderr: (stderr: EngineStderr) => void
        ): void {
            const socket = sockets[workerId]
            assertNotNullOrUndefined(socket, 'sockets[workerId]')

            socket.on(EngineSocketEvent.ENGINE_RESULT, onResult)
            socket.on(EngineSocketEvent.ENGINE_ERROR, onError)
            socket.on(EngineSocketEvent.ENGINE_STDOUT, onStdout)
            socket.on(EngineSocketEvent.ENGINE_STDERR, onStderr)
        },

        unsubscribe(
            workerId: string,
        ): void {
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
                await io.close()
                io = null
            }
        }
    }
}