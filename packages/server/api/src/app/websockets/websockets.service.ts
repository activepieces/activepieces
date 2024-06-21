import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { WebsocketServerEvent } from '@activepieces/shared'

export type WebsocketListener<T> = (socket: Socket) => (data: T) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listener: Record<string, WebsocketListener<any>> = {}

export const websocketService = {
    async init(socket: Socket): Promise<void> {
        const principal = await accessTokenManager.extractPrincipal(socket.handshake.auth.token)
        await socket.join(principal.projectId)
        for (const [event, handler] of Object.entries(listener)) {
            socket.on(event, handler(socket))
        }
    },
    addListener<T>(event: WebsocketServerEvent, handler: WebsocketListener<T>): void {
        listener[event] = handler
    },
}
