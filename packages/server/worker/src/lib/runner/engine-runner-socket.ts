import { IncomingMessage } from 'http'
import { assertNotNullOrUndefined, EngineResponse, EngineSocketEvent, EngineStderr, EngineStdout, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { WebSocket, WebSocketServer } from 'ws'

let wss: WebSocketServer | null = null
const sockets: Record<string, WebSocket> = {}
const resolvePromises: Record<string, (value: boolean) => void> = {}

export const engineRunnerSocket = (log: FastifyBaseLogger) => {
    return {
        async init(): Promise<void> {
            try {
                wss = new WebSocketServer({ port: 12345, path: '/worker/ws' })

                wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
                    const workerId = req.headers['worker-id'] as string
                    log.info('Client connected to engine socket server ' + workerId)

                    // Clean up any existing socket for this workerId
                    if (sockets[workerId]) {
                        this.cleanupSocket(workerId)
                    }

                    sockets[workerId] = ws

                    if (!isNil(resolvePromises[workerId])) {
                        resolvePromises[workerId](true)
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete resolvePromises[workerId]
                    }

                    ws.on('close', () => {
                        log.info({ workerId }, 'Client disconnected from engine socket server')
                        this.cleanupSocket(workerId)
                    })

                    ws.on('error', (error) => {
                        log.error({ error, workerId }, 'Socket error occurred')
                        this.cleanupSocket(workerId)
                    })

                    ws.on('message', (data: string) => {
                        try {
                            const message = JSON.parse(data)
                            if (message.type === EngineSocketEvent.ENGINE_OPERATION) {
                                // Forward the operation to the worker
                                ws.send(JSON.stringify({
                                    type: EngineSocketEvent.ENGINE_OPERATION,
                                    data: message.data,
                                }))
                            }
                        }
                        catch (error) {
                            log.error({ error }, 'Error parsing message')
                        }
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
                socket.close()
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete sockets[workerId]
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete resolvePromises[workerId]
            }
        },

        async waitForConnect(workerId: string): Promise<boolean> {
            if (!isNil(sockets[workerId])) {
                return sockets[workerId].readyState === WebSocket.OPEN
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
            if (socket.readyState !== WebSocket.OPEN) {
                throw new Error(`Socket for worker ${workerId} is not connected`)
            }
            socket.send(JSON.stringify({
                type: EngineSocketEvent.ENGINE_OPERATION,
                data: message,
            }))
        },

        subscribe(
            workerId: string,
            onResult: (result: EngineResponse<unknown>) => void,
            onStdout: (stdout: EngineStdout) => void,
            onStderr: (stderr: EngineStderr) => void,
        ): void {
            const socket = sockets[workerId]
            assertNotNullOrUndefined(socket, 'sockets[workerId]')

            // Remove any existing listeners before adding new ones
            this.unsubscribe(workerId)

            const messageHandler = (data: string) => {
                try {
                    const message = JSON.parse(data)
                    switch (message.type) {
                        case EngineSocketEvent.ENGINE_RESPONSE:
                            onResult(message.data)
                            break
                        case EngineSocketEvent.ENGINE_STDOUT:
                            onStdout(message.data)
                            break
                        case EngineSocketEvent.ENGINE_STDERR:
                            onStderr(message.data)
                            break
                    }
                }
                catch (error) {
                    log.error({ error }, 'Error parsing message')
                }
            }

            socket.on('message', messageHandler)
        },

        unsubscribe(workerId: string): void {
            const socket = sockets[workerId]
            if (socket) {
                socket.removeAllListeners('message')
            }
        },

        async disconnect(): Promise<void> {
            if (wss) {
                // Clean up all sockets
                Object.keys(sockets).forEach(workerId => {
                    this.cleanupSocket(workerId)
                })
                await new Promise<void>((resolve) => {
                    wss?.close(() => resolve())
                })
                wss = null
            }
        },
    }
}