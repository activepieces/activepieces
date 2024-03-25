import { Socket } from 'socket.io'
import { WebsocketServerEvent } from '@activepieces/shared'

export type WebsocketListener<T> = (socket: Socket) => (data: T) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listener: Record<string, WebsocketListener<any>> = {}

export const websocketService = {
    init(socket: Socket): void {
        for (const [event, listner] of Object.entries(listener)) {
            socket.on(event, listner(socket))
        }
    },
    addListener<T>(event: WebsocketServerEvent, listner: WebsocketListener<T>): void {
        listener[event] = listner
    },
}
