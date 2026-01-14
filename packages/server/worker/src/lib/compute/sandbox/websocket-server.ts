import { EngineOperation, EngineOperationType, EngineSocketEvent, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null
const connectionPromises: Record<string, () => void> = {}
const connectionState: Record<string, boolean> = {}
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
            socket.join(sandboxId)

            connectionState[sandboxId] = true
            if (!isNil(connectionPromises[sandboxId])) {
                connectionPromises[sandboxId]()
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete connectionPromises[sandboxId]
            }

            socket.on('message', (msg: { event: EngineSocketEvent, payload: unknown }, callback?: () => void) => {
                const { event, payload } = msg
                const promise = listeners[sandboxId](event, payload)
                promise.then(() => {
                    callback?.()
                }).catch((error) => {
                    log.error(error)
                })
            })
        })

        io.on('disconnect', (socket) => {
            const sandboxId = socket.handshake.auth['sandboxId'] as string
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete connectionState[sandboxId]
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete listeners[sandboxId]
        })

        io.listen(12345)
    },
    async attachListener(sandboxId: string, listener: (event: EngineSocketEvent, payload: unknown) => Promise<void>): Promise<void> {
        listeners[sandboxId] = listener
    },
    async removeListener(sandboxId: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete listeners[sandboxId]
    },
    isConnected(sandboxId: string): boolean {
        return connectionState[sandboxId] ?? false
    },
    send(sandboxId: string, operation: EngineOperation, operationType: EngineOperationType): void {
        const isConnected = this.isConnected(sandboxId)
        if (!isConnected) {
            throw new Error(`Socket for sandbox ${sandboxId} is not connected`)
        }
        io?.to(sandboxId).emit(EngineSocketEvent.ENGINE_OPERATION, { operation, operationType })
    },
    async waitForConnection(sandboxId: string): Promise<void> {
        if (connectionState[sandboxId]) {
            return
        }
        return new Promise<void>((resolve) => {
            connectionPromises[sandboxId] = resolve
        })
    },
    shutdown: () => {
        io?.close()
    },
}

