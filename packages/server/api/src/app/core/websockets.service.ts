import { ActivepiecesError, ErrorCode, isNil, Permission, ProjectRole, tryCatch } from '@activepieces/core-utils'
import { ApiToWorkerContract, createNotifyClient, Principal, PrincipalForType, PrincipalType, SwitchProjectRequest, SwitchProjectResponse, WebsocketServerEvent } from '@activepieces/shared'
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

const projectBySocket = new WeakMap<Socket, SocketProject>()

const projectLeaveHandlers = new Map<string, ProjectLeaveHandler>()

export const websocketService = {
    to: (workerId: string) => app!.io.to(workerId),
    socketHasPermission: ({ socket, permission }: SocketHasPermissionParams): boolean => hasPermission(projectBySocket.get(socket)?.role, permission),
    getProjectId: (socket: Socket): string | null => projectBySocket.get(socket)?.projectId ?? null,
    setProjectLeaveHandler({ name, handler }: SetProjectLeaveHandlerParams): void {
        projectLeaveHandlers.set(name, handler)
    },
    notifyWorkers: () => createNotifyClient<ApiToWorkerContract>(app!.io.to(WORKERS_ROOM)),
    async init(socket: Socket, log: FastifyBaseLogger): Promise<void> {
        const listenersAttached = attachListeners({ socket, log })
        socket.use((_packet, next) => {
            listenersAttached.finally(() => next()).catch(() => undefined)
        })
        await listenersAttached
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

async function attachListeners({ socket, log }: AttachListenersParams): Promise<void> {
    const principal = await websocketService.verifyPrincipal(socket)
    const type = principal.type
    if (![PrincipalType.USER, PrincipalType.WORKER].includes(type)) {
        return
    }

    const castedType = type as keyof typeof listener
    switch (type) {
        case PrincipalType.USER: {
            const handshakeProjectId = parseHandshakeProjectId(socket.handshake.auth.projectId)
            if (!isNil(handshakeProjectId)) {
                const role = await validateProjectId({ userId: principal.id, projectId: handshakeProjectId, log })
                projectBySocket.set(socket, { projectId: handshakeProjectId, role })
                await socket.join(handshakeProjectId)
            }
            log.info({
                message: 'User connected',
                user: { id: principal.id },
                project: { id: handshakeProjectId },
            })
            await socket.join(principal.id)
            socket.on(WebsocketServerEvent.SWITCH_PROJECT, async (data: unknown, callback?: (response: SwitchProjectResponse) => void) => {
                const response = await switchProject({ socket, userId: principal.id, data, log })
                callback?.(response)
            })
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
            if (castedType !== PrincipalType.USER) {
                return rejectedPromiseHandler(handler(socket)(data, principal, null, callback), log)
            }
            const project = projectBySocket.get(socket)
            if (isNil(project)) {
                log.warn({ event, userId: principal.id }, 'Websocket event blocked: no project selected')
                return
            }
            const requiredPermission = eventPermissions[event as WebsocketServerEvent]
            if (!isNil(requiredPermission) && !hasPermission(project.role, requiredPermission)) {
                log.warn({ event, userId: principal.id, projectId: project.projectId, requiredPermission }, 'Websocket event blocked: missing permission')
                return
            }
            return rejectedPromiseHandler(handler(socket)(data, principal, project.projectId, callback), log)
        })
    }
}

async function switchProject({ socket, userId, data, log }: SwitchProjectParams): Promise<SwitchProjectResponse> {
    const request = SwitchProjectRequest.safeParse(data)
    if (!request.success) {
        log.warn({ userId }, 'Websocket project switch rejected: invalid request')
        return { success: false }
    }
    const { projectId } = request.data
    const { error } = await tryCatch(async () => {
        const role = await validateProjectId({ userId, projectId, log })
        const previous = projectBySocket.get(socket)
        if (!isNil(previous) && previous.projectId !== projectId) {
            for (const leaveHandler of projectLeaveHandlers.values()) {
                await leaveHandler({ socket, userId, projectId: previous.projectId })
            }
            await socket.leave(previous.projectId)
        }
        await socket.join(projectId)
        projectBySocket.set(socket, { projectId, role })
    })
    if (!isNil(error)) {
        log.warn({ error, userId, projectId }, 'Websocket project switch rejected')
        return { success: false }
    }
    return { success: true }
}

function parseHandshakeProjectId(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null
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

type SocketProject = {
    projectId: string
    role: ProjectRole
}

type SetProjectLeaveHandlerParams = {
    name: string
    handler: ProjectLeaveHandler
}

type SwitchProjectParams = {
    socket: Socket
    userId: string
    data: unknown
    log: FastifyBaseLogger
}

export type ProjectLeaveHandler = (params: { socket: Socket, userId: string, projectId: string }) => Promise<void>

type SocketHasPermissionParams = {
    socket: Socket
    permission: Permission
}

type AttachListenersParams = {
    socket: Socket
    log: FastifyBaseLogger
}
