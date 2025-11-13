import { AuthorizationType, ProjectResourceType, rejectedPromiseHandler, RouteKind } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, Principal, PrincipalForType, PrincipalType, tryCatch, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { app } from '../server'
import { authorizeOrThrow } from './security/authorize'

export type WebsocketListener<T, PR extends PrincipalType.USER | PrincipalType.WORKER>
    = (socket: Socket) => (data: T, principal: PrincipalForType<PR>, callback?: (data: unknown) => void) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListenerMap<PR extends PrincipalType.USER | PrincipalType.WORKER> = Partial<Record<WebsocketServerEvent, WebsocketListener<any, PR>>>

const listener = {
    [PrincipalType.USER]: {} as ListenerMap<PrincipalType.USER>,
    [PrincipalType.WORKER]: {} as ListenerMap<PrincipalType.WORKER>,
}


export const websocketService = {
    to: (workerId: string) => app!.io.to(workerId),
    async init(socket: Socket, log: FastifyBaseLogger): Promise<void> {
        const principal = await websocketService.verifyPrincipal(socket)

        const type = principal.type
        const { error } = await tryCatch<void, ActivepiecesError>(() => authorizeForWebsocket(principal, socket.handshake.auth.projectId, log))
        if (error) {
            return
        }
        const castedType = type as keyof typeof listener
        switch (type) {
            case PrincipalType.USER: {
                log.info({
                    message: 'User connected',
                    userId: principal.id,
                    projectId: socket.handshake.auth.projectId,
                })
                await socket.join(socket.handshake.auth.projectId)
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
    addListener<T, PR extends PrincipalType.WORKER | PrincipalType.USER>(principalType: PR, event: WebsocketServerEvent, handler: WebsocketListener<T, PR>): void {
        switch (principalType) {
            case PrincipalType.USER: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                listener[PrincipalType.USER][event] = handler as unknown as WebsocketListener<any, PrincipalType.USER>
                break
            }
            case PrincipalType.WORKER: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                listener[PrincipalType.WORKER][event] = handler as unknown as WebsocketListener<any, PrincipalType.WORKER>
                break
            }
        }
    },
}


async function authorizeForWebsocket(principal: Principal, projectId: string, log: FastifyBaseLogger): Promise<void> {
    switch (principal.type) {
        case PrincipalType.USER: {
            await authorizeOrThrow(principal, {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    projectId,
                },
            }, log)
            break;
        }
        case PrincipalType.WORKER: {
            break;
        }
        default: {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'principal is not allowed for websocket',
                },
            })
        }
    }
}