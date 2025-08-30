import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, Principal, PrincipalType, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { app } from '../server'

export type WebsocketListener<T> = (socket: Socket) => (data: T, principal: Principal, callback?: (data: unknown) => void) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListenerMap = Partial<Record<WebsocketServerEvent, WebsocketListener<any>>>

const listener: Record<PrincipalType.USER | PrincipalType.WORKER, ListenerMap> = {
    [PrincipalType.USER]: {},
    [PrincipalType.WORKER]: {},
}


export const websocketService = {
    to: (workerId: string) => app!.io.to(workerId),
    async init(socket: Socket, log: FastifyBaseLogger): Promise<void> {
        const principal = await websocketService.verifyPrincipal(socket)
        const type = principal.type
        if (![PrincipalType.USER, PrincipalType.WORKER].includes(type)) {
            return
        }
        const castedType = type as keyof typeof listener
        switch (type) {
            case PrincipalType.USER: {
                log.info({
                    message: 'User connected',
                    userId: principal.id,
                    projectId: principal.projectId,
                })
                await socket.join(principal.projectId)
                break
            }
            case PrincipalType.WORKER: {
                const workerId = socket.handshake.auth.workerId
                log.info({
                    message: 'Worker connected',
                    workerId,
                })
                await socket.join(workerId)
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
            socket.on(event, async (data, callback) => rejectedPromiseHandler(handler(socket)(data, principal, callback), log))
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
