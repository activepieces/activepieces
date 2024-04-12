import { Socket } from 'socket.io'
import { WebsocketServerEvent } from '@activepieces/shared'

export type WebsocketListener<T> = (socket: Socket) => (data: T) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listener: Record<string, WebsocketListener<any>> = {}

export const websocketService = {
    init(socket: Socket): void {
        for (const [event, handler] of Object.entries(listener)) {
            socket.on(event, handler(socket))
        }
    },
    addListener<T>(event: WebsocketServerEvent, handler: WebsocketListener<T>): void {
        listener[event] = handler
    },
}
