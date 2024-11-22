import { exceptionHandler } from '@activepieces/server-shared'
import { WebsocketServerEvent } from '@activepieces/shared'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'

export type WebsocketListener<T> = (socket: Socket) => (data: T) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listener: Record<string, WebsocketListener<any>> = {}

export const websocketService = {
    async init(socket: Socket): Promise<void> {
        const principal = await accessTokenManager.verifyPrincipal(socket.handshake.auth.token)
        await socket.join(principal.projectId)
        for (const [event, handler] of Object.entries(listener)) {
            socket.on(event, async (data) => {
                try {
                    await handler(socket)(data)
                }
                catch (error) {
                    exceptionHandler.handle(error)
                }
            })
        }
    },
    addListener<T>(event: WebsocketServerEvent, handler: WebsocketListener<T>): void {
        listener[event] = handler
    },
}
