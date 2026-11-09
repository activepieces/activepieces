import { isNil, tryCatch } from '@activepieces/core-utils'
import { LockResourceRequest, LockResourceResponse, PrincipalType, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { Socket } from 'socket.io'
import { userService } from '../../../user/user-service'
import { websocketService } from '../../websockets.service'
import { collaborativeResource } from '../collaborative-resource'
import { lockService } from './lock.service'

export const lockModule: FastifyPluginAsyncZod = async (app) => {
    websocketService.onProjectLeave({
        name: 'lock',
        handler: ({ socket, userId }) => releaseHeldLocks({ socket, userId, app }),
    })
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
                    trackLockedResource({ socket, resourceId, held: { projectId, editorSessionId: editorSessionId ?? null } })
                    socket.to(projectId).emit(WebsocketClientEvent.RESOURCE_LOCKED, {
                        resourceId,
                        userId: principal.id,
                        userDisplayName: displayName,
                    })
                }

                callback?.(result)
            }
            catch (error) {
                app.log.error({ error }, '[LOCK_RESOURCE] Failed to acquire lock')
                callback?.({ acquired: false, lock: null })
            }
        }
    }, { rejectResponse: LOCK_NOT_ACQUIRED, orderedWithSwitch: true })
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
    }, { orderedWithSwitch: true })
}

const LOCK_NOT_ACQUIRED: LockResourceResponse = { acquired: false, lock: null }

const lockedResourcesBySocket = new WeakMap<Socket, ReadonlyMap<string, HeldLock>>()

function trackLockedResource({ socket, resourceId, held }: TrackParams): void {
    const locks = lockedResourcesBySocket.get(socket) ?? new Map<string, HeldLock>()
    lockedResourcesBySocket.set(socket, new Map([...locks, [resourceId, held]]))
}

function untrackLockedResource({ socket, resourceId }: UntrackParams): void {
    const locks = lockedResourcesBySocket.get(socket)
    if (isNil(locks)) {
        return
    }
    lockedResourcesBySocket.set(socket, new Map([...locks].filter(([id]) => id !== resourceId)))
}

async function releaseHeldLocks({ socket, userId, app }: ReleaseHeldLocksParams): Promise<void> {
    const locks = lockedResourcesBySocket.get(socket) ?? new Map<string, HeldLock>()
    for (const [resourceId, { projectId, editorSessionId }] of locks) {
        const { data: released, error } = await tryCatch(() => lockService(app.log).release({
            resourceId,
            projectId,
            userId,
            editorSessionId,
        }))
        if (!isNil(error)) {
            app.log.error({ error, resourceId, project: { id: projectId } }, '[releaseHeldLocks] Could not release a held lock, it stays tracked for the next leave')
            continue
        }
        untrackLockedResource({ socket, resourceId })
        if (released) {
            websocketService.to(projectId).emit(WebsocketClientEvent.RESOURCE_UNLOCKED, {
                resourceId,
            })
        }
    }
}

type HeldLock = {
    projectId: string
    editorSessionId: string | null
}

type TrackParams = {
    socket: Socket
    resourceId: string
    held: HeldLock
}

type UntrackParams = {
    socket: Socket
    resourceId: string
}

type ReleaseHeldLocksParams = {
    socket: Socket
    userId: string
    app: FastifyInstance
}
