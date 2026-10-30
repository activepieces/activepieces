import { isNil } from '@activepieces/core-utils'
import { LockResourceRequest, PrincipalType, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { Socket } from 'socket.io'
import { userService } from '../../../user/user-service'
import { websocketService } from '../../websockets.service'
import { collaborativeResource } from '../collaborative-resource'
import { lockService } from './lock.service'

export const lockModule: FastifyPluginAsyncZod = async (app) => {
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.LOCK_RESOURCE, (socket) => {
        return async (data: unknown, principal, projectId, callback) => {
            const request = LockResourceRequest.safeParse(data)
            if (!request.success) {
                callback?.({ acquired: false, lock: null })
                return
            }
            const { resourceId, force, editorSessionId } = request.data
            app.log.info({ resourceId }, '[Lock] LOCK_RESOURCE event received')
            try {
                const resource = await collaborativeResource.resolve({ resourceId, projectId })
                if (isNil(resource)) {
                    app.log.warn({ resourceId, user: { id: principal.id }, project: { id: projectId } }, '[LOCK_RESOURCE] Denied: resource does not belong to this project')
                    callback?.({ acquired: false, lock: null })
                    return
                }
                if (!websocketService.socketHasPermission({ socket, permission: resource.writePermission })) {
                    app.log.debug({ resourceId, user: { id: principal.id }, project: { id: projectId } }, '[LOCK_RESOURCE] Denied: missing write permission')
                    callback?.({ acquired: false, lock: null })
                    return
                }

                const user = await userService(app.log).getMetaInformation({ id: principal.id })
                const displayName = `${user.firstName} ${user.lastName}`

                const result = await lockService(app.log).acquire({
                    resourceId,
                    projectId,
                    userId: principal.id,
                    userDisplayName: displayName,
                    editorSessionId,
                    force,
                })

                if (result.acquired) {
                    trackLockedResource({ socket, resourceId, editorSessionId: editorSessionId ?? null })
                    socket.to(projectId).emit(WebsocketClientEvent.RESOURCE_LOCKED, {
                        resourceId,
                        userId: principal.id,
                        userDisplayName: displayName,
                    })
                }

                registerLockDisconnectHandler({ socket, userId: principal.id, projectId, app })

                callback?.(result)
            }
            catch (error) {
                app.log.error({ error }, '[LOCK_RESOURCE] Failed to acquire lock')
                callback?.({ acquired: false, lock: null })
            }
        }
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.UNLOCK_RESOURCE, (socket) => {
        return async (data: unknown, principal, projectId) => {
            const request = LockResourceRequest.safeParse(data)
            if (!request.success) {
                return
            }
            const { resourceId, editorSessionId } = request.data
            try {
                const released = await lockService(app.log).release({
                    resourceId,
                    projectId,
                    userId: principal.id,
                    editorSessionId,
                })
                untrackLockedResource({ socket, resourceId })
                if (released) {
                    websocketService.to(projectId).emit(WebsocketClientEvent.RESOURCE_UNLOCKED, {
                        resourceId,
                    })
                }
            }
            catch (error) {
                app.log.error({ error }, '[UNLOCK_RESOURCE] Failed to release lock')
            }
        }
    })
}

const lockedResourcesBySocket = new WeakMap<Socket, ReadonlyMap<string, string | null>>()
const socketsWithLockDisconnectHandler = new WeakSet<Socket>()

function trackLockedResource({ socket, resourceId, editorSessionId }: TrackParams): void {
    const held = lockedResourcesBySocket.get(socket) ?? new Map<string, string | null>()
    lockedResourcesBySocket.set(socket, new Map([...held, [resourceId, editorSessionId]]))
}

function untrackLockedResource({ socket, resourceId }: UntrackParams): void {
    const held = lockedResourcesBySocket.get(socket)
    if (isNil(held)) {
        return
    }
    lockedResourcesBySocket.set(socket, new Map([...held].filter(([id]) => id !== resourceId)))
}

function registerLockDisconnectHandler({ socket, userId, projectId, app }: RegisterDisconnectHandlerParams): void {
    if (socketsWithLockDisconnectHandler.has(socket)) {
        return
    }
    socketsWithLockDisconnectHandler.add(socket)
    socket.once('disconnect', async () => {
        const held = lockedResourcesBySocket.get(socket) ?? new Map<string, string | null>()
        for (const [resourceId, editorSessionId] of held) {
            const released = await lockService(app.log).release({
                resourceId,
                projectId,
                userId,
                editorSessionId,
            })
            if (released) {
                websocketService.to(projectId).emit(WebsocketClientEvent.RESOURCE_UNLOCKED, {
                    resourceId,
                })
            }
        }
    })
}

type TrackParams = {
    socket: Socket
    resourceId: string
    editorSessionId: string | null
}

type UntrackParams = {
    socket: Socket
    resourceId: string
}

type RegisterDisconnectHandlerParams = {
    socket: Socket
    userId: string
    projectId: string
    app: FastifyInstance
}
