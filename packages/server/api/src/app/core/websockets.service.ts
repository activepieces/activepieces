import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, Principal, PrincipalForType, PrincipalType, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { app } from '../server'

export type WebsocketListener<T, PR extends PrincipalType.USER | PrincipalType.WORKER> = (socket: Socket) => (data: T, principal: PrincipalForType<PR>, projectId: PR extends PrincipalType.USER ? string : null, callback?: (data: unknown) => void) => Promise<void>

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
        if (![PrincipalType.USER, PrincipalType.WORKER].includes(type)) {
            return
        }

        const castedType = type as keyof typeof listener
        const projectId = socket.handshake.auth.projectId
        switch (type) {
            case PrincipalType.USER: {
                await validateProjectId({ userId: principal.id, projectId, log })
                log.info({
                    message: 'User connected',
                    userId: principal.id,
                    projectId,
                })
                await socket.join(projectId)
                await socket.join(principal.id)
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
            socket.on(event, async (data, callback) => rejectedPromiseHandler(handler(socket)(data, principal, projectId, callback), log))
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
    emitWithAck<T = unknown>(event: WebsocketServerEvent, workerId: string, data?: unknown): Promise<T> {
        return app!.io.to([workerId]).timeout(4000).emitWithAck(event, data)
    },
}

const validateProjectId = async ({ userId, projectId, log }: ValidateProjectIdArgs): Promise<void> => {
    if (isNil(projectId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: {
                message: 'Project ID is required',
            },
        })
    }
    const role = await projectMemberService(log).getRole({
        projectId,
        userId,
    })

    if (isNil(role)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'User not allowed to access this project',
            },
        })
    }
}

type ValidateProjectIdArgs = {
    userId: string
    projectId?: string
    log: FastifyBaseLogger
}