import { EngineOperation, EngineOperationType, EngineSocketEvent, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket, Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null
let logger: FastifyBaseLogger | null = null
const connectionPromises: Record<string, () => void> = {}
const sockets: Record<string, Socket> = {}
const listeners: Record<string, (operation: EngineSocketEvent, payload: unknown) => Promise<void>> = {}

export const sandboxWebsocketServer = {
    init: (log: FastifyBaseLogger) => {
        logger = log
        io = new SocketIOServer({
            path: '/worker/ws',
            maxHttpBufferSize: 1e8,
            cors: {
                origin: '*',
            },
        })

        io.on('connection', (socket) => {
            const sandboxId = socket.handshake.auth['sandboxId'] as string
            const isReconnection = !isNil(sockets[sandboxId])
            const hadListener = !isNil(listeners[sandboxId])
            log.info({ 
                sandboxId, 
                isReconnection, 
                hadListener,
                socketId: socket.id,
            }, '[WebSocket] Sandbox connected')
            sockets[sandboxId] = socket
            if (!isNil(connectionPromises[sandboxId])) {
                connectionPromises[sandboxId]()
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete connectionPromises[sandboxId]
            }

            socket.on('command', (msg: { event: EngineSocketEvent, payload: unknown }, callback?: () => void) => {
                const { event, payload } = msg
                log.debug({ sandboxId, event, payload }, '[WebSocket] Received message from sandbox')
                const listener = listeners[sandboxId]
                if (isNil(listener)) {
                    const socketExists = !isNil(sockets[sandboxId])
                    const socketConnected = sockets[sandboxId]?.connected ?? false
                    log.error({ 
                        sandboxId, 
                        event, 
                        socketExists,
                        socketConnected,
                        socketId: socket.id,
                        hasCallback: !isNil(callback),
                    }, '[WebSocket] Received message from sandbox after listener was removed')
                    return
                }
                const promise = listener(event, payload)
                promise.then(() => {
                    callback?.()
                }).catch((error) => {
                    log.error(error, '[WebSocket] Error in listener callback')
                })
            })

            socket.on('disconnect', (reason) => {
                const hadListener = !isNil(listeners[sandboxId])
                log.info({ 
                    sandboxId, 
                    hadListener,
                    reason,
                    socketId: socket.id,
                }, '[WebSocket] Sandbox disconnected')
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete sockets[sandboxId]
                socket.removeAllListeners('command')

            })
        })


        io.listen(12345)
    },
    attachListener(sandboxId: string, listener: (event: EngineSocketEvent, payload: unknown) => Promise<void>): void {
        const isOverwriting = !isNil(listeners[sandboxId])
        const socketExists = !isNil(sockets[sandboxId])
        const socketConnected = sockets[sandboxId]?.connected ?? false
        logger?.info({ 
            sandboxId, 
            isOverwriting,
            socketExists,
            socketConnected,
        }, '[WebSocket] Attaching listener')
        listeners[sandboxId] = listener
    },
    removeListener(sandboxId: string): void {
        const hadListener = !isNil(listeners[sandboxId])
        logger?.info({ sandboxId, hadListener }, '[WebSocket] Removing listener')
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
