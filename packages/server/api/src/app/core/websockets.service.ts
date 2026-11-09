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

const eventRejectResponses: Partial<Record<WebsocketServerEvent, unknown>> = {}

const DEFAULT_REJECT_RESPONSE = { success: false }

const eventsOrderedWithSwitch = new Set<WebsocketServerEvent>()

const projectBySocket = new WeakMap<Socket, SocketProject>()

const projectLeaveHandlers = new Map<string, ProjectLeaveHandler>()

const pendingWorkBySocket = new WeakMap<Socket, Promise<void>>()

export const websocketService = {
    to: (workerId: string) => app!.io.to(workerId),
    socketHasPermission: ({ socket, permission }: SocketHasPermissionParams): boolean => hasPermission(projectBySocket.get(socket)?.role, permission),
    getProjectId: (socket: Socket): string | null => projectBySocket.get(socket)?.projectId ?? null,
    onProjectLeave({ name, handler }: OnProjectLeaveParams): void {
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
    addListener<T, PR extends PrincipalType.WORKER | PrincipalType.USER>(principalType: PR, event: WebsocketServerEvent, handler: WebsocketListener<T, PR>, options?: ListenerOptions): void {
        switch (principalType) {
            case PrincipalType.USER: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                listener[PrincipalType.USER][event] = handler as unknown as WebsocketListener<any, PrincipalType.USER>
                if (!isNil(options?.permission)) {
                    eventPermissions[event] = options.permission
                }
                if (!isNil(options?.rejectResponse)) {
                    eventRejectResponses[event] = options.rejectResponse
                }
                if (options?.orderedWithSwitch === true) {
                    eventsOrderedWithSwitch.add(event)
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

    switch (principal.type) {
        case PrincipalType.USER: {
            const handshakeProjectId = parseHandshakeProjectId(socket.handshake.auth.projectId)
            const joinedProjectId = isNil(handshakeProjectId) ? null : await joinHandshakeProject({ socket, userId: principal.id, projectId: handshakeProjectId, log })
            log.info({
                message: 'User connected',
                user: { id: principal.id },
                ...(isNil(joinedProjectId) ? {} : { project: { id: joinedProjectId } }),
            })
            await socket.join(principal.id)
            socket.once('disconnect', () => runInSocketOrder({ socket, work: () => leaveCurrentProject({ socket, userId: principal.id, log }) }))
            socket.on(WebsocketServerEvent.SWITCH_PROJECT, async (data: unknown, callback?: (response: SwitchProjectResponse) => void) => {
                const response = await runInSocketOrder({ socket, work: () => switchProject({ socket, userId: principal.id, data, log }) })
                callback?.(response)
            })
            for (const event of Object.values(WebsocketServerEvent)) {
                const handler = listener[PrincipalType.USER][event]
                if (isNil(handler)) {
                    continue
                }
                socket.on(toSocketEvent(event), async (data: unknown, callback?: (data: unknown) => void) => {
                    const work = (): Promise<void> => runUserEvent({ socket, event, handler, data, principal, callback, log })
                    return eventsOrderedWithSwitch.has(event) ? runInSocketOrder({ socket, work }) : work()
                })
            }
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
            for (const event of Object.values(WebsocketServerEvent)) {
                const handler = listener[PrincipalType.WORKER][event]
                if (isNil(handler)) {
                    continue
                }
                socket.on(toSocketEvent(event), async (data: unknown, callback?: (data: unknown) => void) => {
                    return rejectedPromiseHandler(handler(socket)(data, principal, null, callback), log)
                })
            }
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
}

function toSocketEvent(event: WebsocketServerEvent): string {
    return event === WebsocketServerEvent.DISCONNECT ? 'disconnect' : event
}

async function runUserEvent({ socket, event, handler, data, principal, callback, log }: RunUserEventParams): Promise<void> {
    const reject = (): void => callback?.(eventRejectResponses[event] ?? DEFAULT_REJECT_RESPONSE)
    const project = projectBySocket.get(socket)
    if (isNil(project)) {
        log.warn({ event, user: { id: principal.id } }, 'Websocket event blocked: no project selected')
        reject()
        return
    }
    const requiredPermission = eventPermissions[event]
    if (!isNil(requiredPermission) && !hasPermission(project.role, requiredPermission)) {
        log.warn({ event, user: { id: principal.id }, project: { id: project.projectId }, requiredPermission }, 'Websocket event blocked: missing permission')
        reject()
        return
    }
    const { error } = await tryCatch(() => handler(socket)(data, principal, project.projectId, callback))
    if (!isNil(error)) {
        log.error({ error, event, user: { id: principal.id }, project: { id: project.projectId } }, 'Websocket event failed')
        reject()
    }
}

function runInSocketOrder<T>({ socket, work }: RunInSocketOrderParams<T>): Promise<T> {
    const previous = pendingWorkBySocket.get(socket) ?? Promise.resolve()
    const next = previous.then(work)
    pendingWorkBySocket.set(socket, next.then(() => undefined, () => undefined))
    return next
}

async function joinHandshakeProject({ socket, userId, projectId, log }: JoinHandshakeProjectParams): Promise<string | null> {
    const { data: role, error } = await tryCatch(() => validateProjectId({ userId, projectId, log }))
    if (isNil(role)) {
        log.warn({ error, user: { id: userId }, project: { id: projectId } }, 'Websocket handshake project rejected, connected without a project')
        return null
    }
    projectBySocket.set(socket, { projectId, role })
    await socket.join(projectId)
    return projectId
}

async function switchProject({ socket, userId, data, log }: SwitchProjectParams): Promise<SwitchProjectResponse> {
    const request = SwitchProjectRequest.safeParse(data)
    if (!request.success) {
        log.warn({ user: { id: userId } }, 'Websocket project switch rejected: invalid request')
        return { success: false }
    }
    const { projectId } = request.data
    const { error } = await tryCatch(async () => {
        const role = await validateProjectId({ userId, projectId, log })
        const previous = projectBySocket.get(socket)
        if (!isNil(previous) && previous.projectId !== projectId) {
            await runProjectLeaveHandlers({ socket, userId, projectId: previous.projectId, log })
            await socket.leave(previous.projectId)
        }
        await socket.join(projectId)
        projectBySocket.set(socket, { projectId, role })
    })
    if (!isNil(error)) {
        log.warn({ error, user: { id: userId }, project: { id: projectId } }, 'Websocket project switch rejected')
        return { success: false }
    }
    return { success: true }
}

async function leaveCurrentProject({ socket, userId, log }: LeaveCurrentProjectParams): Promise<void> {
    const project = projectBySocket.get(socket)
    if (isNil(project)) {
        return
    }
    await runProjectLeaveHandlers({ socket, userId, projectId: project.projectId, log })
}

async function runProjectLeaveHandlers({ socket, userId, projectId, log }: RunProjectLeaveHandlersParams): Promise<void> {
    for (const [name, handler] of projectLeaveHandlers) {
        const { error } = await tryCatch(() => handler({ socket, userId, projectId }))
        if (!isNil(error)) {
            log.error({ error, handler: name, user: { id: userId }, project: { id: projectId } }, 'Websocket project leave handler failed')
        }
    }
}

function parseHandshakeProjectId(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null
}

async function validateProjectId({ userId, projectId, log }: ValidateProjectIdArgs): Promise<ProjectRole> {
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
    projectId: string
    log: FastifyBaseLogger
}

type ListenerOptions = {
    permission?: Permission
    rejectResponse?: unknown
    orderedWithSwitch?: boolean
}

type SocketProject = {
    projectId: string
    role: ProjectRole
}

type OnProjectLeaveParams = {
    name: string
    handler: ProjectLeaveHandler
}

type SwitchProjectParams = {
    socket: Socket
    userId: string
    data: unknown
    log: FastifyBaseLogger
}

type LeaveCurrentProjectParams = {
    socket: Socket
    userId: string
    log: FastifyBaseLogger
}

type RunProjectLeaveHandlersParams = {
    socket: Socket
    userId: string
    projectId: string
    log: FastifyBaseLogger
}

type ProjectLeaveHandler = (params: { socket: Socket, userId: string, projectId: string }) => Promise<void>

type SocketHasPermissionParams = {
    socket: Socket
    permission: Permission
}

type RunUserEventParams = {
    socket: Socket
    event: WebsocketServerEvent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: WebsocketListener<any, PrincipalType.USER>
    data: unknown
    principal: PrincipalForType<PrincipalType.USER>
    callback?: (data: unknown) => void
    log: FastifyBaseLogger
}

type RunInSocketOrderParams<T> = {
    socket: Socket
    work: () => Promise<T>
}

type JoinHandshakeProjectParams = {
    socket: Socket
    userId: string
    projectId: string
    log: FastifyBaseLogger
}

type AttachListenersParams = {
    socket: Socket
    log: FastifyBaseLogger
}
