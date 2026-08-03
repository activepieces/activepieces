import { ActivepiecesError, ErrorCode, isNil, Permission, ProjectRole } from '@activepieces/core-utils'
import { ApiToWorkerContract, createNotifyClient, Principal, PrincipalForType, PrincipalType, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { app } from '../server'

export type WebsocketListener<T, PR extends PrincipalType.USER | PrincipalType.WORKER> = (socket: Socket) => (data: T, principal: PrincipalForType<PR>, projectId: PR extends PrincipalType.USER ? string : null, callback?: (data: unknown) => void) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListenerMap<PR extends PrincipalType.USER | PrincipalType.WORKER> = Partial<Record<WebsocketServerEvent, WebsocketListener<any, PR>>>

const WORKERS_ROOM = 'WORKERS'

const listener = {
    [PrincipalType.USER]: {} as ListenerMap<PrincipalType.USER>,
    [PrincipalType.WORKER]: {} as ListenerMap<PrincipalType.WORKER>,
}

const eventPermissions: Partial<Record<WebsocketServerEvent, Permission>> = {}

export const websocketService = {
    to: (workerId: string) => app!.io.to(workerId),
    notifyWorkers: () => createNotifyClient<ApiToWorkerContract>(app!.io.to(WORKERS_ROOM)),
    async init(socket: Socket, log: FastifyBaseLogger): Promise<void> {
        const principal = await websocketService.verifyPrincipal(socket)
        const type = principal.type
        if (![PrincipalType.USER, PrincipalType.WORKER].includes(type)) {
            return
        }

        const castedType = type as keyof typeof listener
        const projectId = socket.handshake.auth.projectId
        let projectRole: ProjectRole | undefined
        switch (type) {
            case PrincipalType.USER: {
                projectRole = await validateProjectId({ userId: principal.id, projectId, log })
                log.info({
                    message: 'User connected',
                    user: { id: principal.id },
                    project: { id: projectId },
                })
                await socket.join(projectId)
                await socket.join(principal.id)
                break
            }
            case PrincipalType.WORKER: {
                const workerId = socket.handshake.auth.workerId
                log.info({
                    message: 'Worker connected',
                    worker: { id: workerId },
                })
                await socket.join(workerId)
                await socket.join(WORKERS_ROOM)
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
            // Socket.IO emits the reserved lowercase 'disconnect' per-socket; map our DISCONNECT enum
            // onto it or the handler never fires (it never did — worker cleanup relied on the 60s sweep).
            const socketEvent = event === WebsocketServerEvent.DISCONNECT ? 'disconnect' : event
            socket.on(socketEvent, async (data, callback) => {
                // Permissions are a project-role concept, so they only apply to USER principals.
                const requiredPermission = castedType === PrincipalType.USER
                    ? eventPermissions[event as WebsocketServerEvent]
                    : undefined
                if (!isNil(requiredPermission) && !hasPermission(projectRole, requiredPermission)) {
                    log.warn({ event, userId: principal.id, projectId, requiredPermission }, 'Websocket event blocked: missing permission')
                    return
                }
                return rejectedPromiseHandler(handler(socket)(data, principal, projectId, callback), log)
            })
        }
    },
    async verifyPrincipal(socket: Socket): Promise<Principal> {
        return accessTokenManager(app!.log).verifyPrincipal(socket.handshake.auth.token)
    },
    addListener<T, PR extends PrincipalType.WORKER | PrincipalType.USER>(principalType: PR, event: WebsocketServerEvent, handler: WebsocketListener<T, PR>, permission?: Permission): void {
        switch (principalType) {
            case PrincipalType.USER: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                listener[PrincipalType.USER][event] = handler as unknown as WebsocketListener<any, PrincipalType.USER>
                if (!isNil(permission)) {
                    eventPermissions[event] = permission
                }
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

const validateProjectId = async ({ userId, projectId, log }: ValidateProjectIdArgs): Promise<ProjectRole> => {
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
    return role
}

function hasPermission(role: ProjectRole | undefined, permission: Permission): boolean {
    return !isNil(role) && (role.permissions ?? []).includes(permission)
}

type ValidateProjectIdArgs = {
    userId: string
    projectId?: string
    log: FastifyBaseLogger
}