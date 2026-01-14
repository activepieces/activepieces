import { EngineSocketEvent, isNil } from '@activepieces/shared'
import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null
const connectionPromises: Record<string, () => void> = {}
const connectionState: Record<string, boolean> = {}
const listeners: Record<string, (operation: EngineSocketEvent, payload: unknown) => void> = {}

export const sandboxWebsocketServer = {
    init: () => {
        io = new SocketIOServer({
            path: '/worker/ws',
            maxHttpBufferSize: 1e8,
            cors: {
                origin: '*',
            },
        })

        io.on('connection', (socket) => {
            const workerId = socket.handshake.auth['workerId'] as string
            socket.join(workerId)

            connectionState[workerId] = true
            if (!isNil(connectionPromises[workerId])) {
                connectionPromises[workerId]()
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete connectionPromises[workerId]
            }

            socket.on("message", (msg: { event: EngineSocketEvent, payload: unknown }) => {
                const { event, payload } = msg
                listeners[workerId](event, payload)
            })
        })

        io.on('disconnect', (socket) => {
            const workerId = socket.handshake.auth['workerId'] as string
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete connectionState[workerId]
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete listeners[workerId]
        })

        io.listen(12345)
    },
    async waitForConnection(workerId: string): Promise<void> {
        if (connectionState[workerId]) {
            return
        }
        return new Promise<void>((resolve) => {
            connectionPromises[workerId] = resolve
        })
    },
    shutdown: () => {
        io?.close()
    },
}
