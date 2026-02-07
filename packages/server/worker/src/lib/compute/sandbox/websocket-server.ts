import { EngineOperation, EngineOperationType, EngineSocketEvent, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket, Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null
const connectionPromises: Record<string, () => void> = {}
const sockets: Record<string, Socket> = {}
const listeners: Record<string, (operation: EngineSocketEvent, payload: unknown) => Promise<void>> = {}

export const sandboxWebsocketServer = {
    init: (log: FastifyBaseLogger) => {
        io = new SocketIOServer({
            path: '/worker/ws',
            maxHttpBufferSize: 1e8,
            cors: {
                origin: '*',
            },
        })

        io.on('connection', (socket) => {
            const sandboxId = socket.handshake.auth['sandboxId'] as string
            log.debug({ sandboxId }, 'Sandbox connected')
            sockets[sandboxId] = socket
            if (!isNil(connectionPromises[sandboxId])) {
                connectionPromises[sandboxId]()
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete connectionPromises[sandboxId]
            }

            socket.on('command', (msg: { event: EngineSocketEvent, payload: unknown }, callback?: () => void) => {
                const { event, payload } = msg
                log.debug({ sandboxId, event, payload }, 'Received message from sandbox')
                const listener = listeners[sandboxId]
                if (isNil(listener)) {
                    log.warn({ sandboxId, event }, 'Received message from sandbox after listener was removed, ignoring')
                    return
                }
                const promise = listener(event, payload)
                promise.then(() => {
                    callback?.()
                }).catch((error) => {
                    log.error(error)
                })
            })

            socket.on('disconnect', () => {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete sockets[sandboxId]
                socket.removeAllListeners('command')
                sandboxWebsocketServer.removeListener(sandboxId)

            })
        })


        io.listen(12345)
    },
    attachListener(sandboxId: string, listener: (event: EngineSocketEvent, payload: unknown) => Promise<void>): void {
        listeners[sandboxId] = listener
    },
    removeListener(sandboxId: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete listeners[sandboxId]
    },
    isConnected(sandboxId: string): boolean {

        const socket = sockets[sandboxId]
        if (!isNil(socket)) {
            return socket.connected
        }
        return false
    },
    send(sandboxId: string, operation: EngineOperation, operationType: EngineOperationType): void {
        const socket = sockets[sandboxId]
        if (isNil(socket) || !socket.connected) {
            throw new Error(`Socket for sandbox ${sandboxId} is not connected`)
        }
        socket.emit(EngineSocketEvent.ENGINE_OPERATION, { operation, operationType })
    },
    async waitForConnection(sandboxId: string): Promise<void> {
        if (this.isConnected(sandboxId)) {
            return
        }
        return new Promise<void>((resolve) => {
            connectionPromises[sandboxId] = resolve
        })
    },
    shutdown: async () => {
        for (const socket of Object.values(sockets)) {
            socket.disconnect()
        }
        await io?.close()
    },
}

