import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, Principal, PrincipalType, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'

export type WebsocketListener<T> = (socket: Socket) => (data: T, principal: Principal) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListenerMap = Partial<Record<WebsocketServerEvent, WebsocketListener<any>>>

const listener: Record<PrincipalType.USER | PrincipalType.WORKER, ListenerMap> = {
    [PrincipalType.USER]: {},
    [PrincipalType.WORKER]: {},
}


export const websocketService = {
    async init(socket: Socket, log: FastifyBaseLogger): Promise<void> {
        const principal = await websocketService.verifyPrincipal(socket)
        const type = principal.type
        if (![PrincipalType.USER, PrincipalType.WORKER].includes(type)) {
            return
        }
        const castedType = type as keyof typeof listener
        switch (type) {
            case PrincipalType.USER: {
                await socket.join(principal.projectId)
                break
            }
            case PrincipalType.WORKER: {
                await socket.join(principal.id)
                break
            }
            default: {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHENTICATION,
                    params: {
                        message: 'Invalid principal type',
                    },
                })
            }
        }
        for (const [event, handler] of Object.entries(listener[castedType])) {
            socket.on(event, async (data) => rejectedPromiseHandler(handler(socket)(data, principal), log))
        }
        for (const handler of Object.values(listener[castedType][WebsocketServerEvent.CONNECT] ?? {})) {
            handler(socket)
        }
    },
    async onDisconnect(socket: Socket): Promise<void> {
        const principal = await websocketService.verifyPrincipal(socket)
        const castedType = principal.type as keyof typeof listener
        for (const handler of Object.values(listener[castedType][WebsocketServerEvent.DISCONNECT] ?? {})) {
            handler(socket)
        }
    },
    async verifyPrincipal(socket: Socket): Promise<Principal> {
        return accessTokenManager.verifyPrincipal(socket.handshake.auth.token)
    },
    addListener<T>(principalType: keyof typeof listener, event: WebsocketServerEvent, handler: WebsocketListener<T>): void {
        listener[principalType][event] = handler
    },
}
