import { LockResourceRequest, PrincipalType, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { userService } from '../../../user/user-service'
import { websocketService } from '../../websockets.service'
import { lockService } from './lock.service'

export const lockModule: FastifyPluginAsyncZod = async (app) => {
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.LOCK_RESOURCE, (socket) => {
        return async (data: LockResourceRequest, principal, projectId, callback) => {
            app.log.info({ resourceId: data.resourceId }, '[Lock] LOCK_RESOURCE event received')
            try {
                const user = await userService(app.log).getMetaInformation({ id: principal.id })
                const displayName = `${user.firstName} ${user.lastName}`

                const result = await lockService(app.log).acquire({
                    resourceId: data.resourceId,
                    userId: principal.id,
                    userDisplayName: displayName,
                    force: data.force,
                })

                if (result.acquired) {
                    socket.data.lockedResourceId = data.resourceId
                    socket.to(projectId).emit(WebsocketClientEvent.RESOURCE_LOCKED, {
                        resourceId: data.resourceId,
                        userId: principal.id,
                        userDisplayName: displayName,
                    })
                }

                registerLockDisconnectHandler({ socket, userId: principal.id, projectId, app })

                callback?.(result)
            }
            catch (error) {
                app.log.error({ err: error }, '[LOCK_RESOURCE] Failed to acquire lock')
                callback?.({ acquired: false, lock: null })
            }
        }
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.UNLOCK_RESOURCE, (socket) => {
        return async (data: { resourceId: string }, principal, projectId) => {
            try {
                const released = await lockService(app.log).release({
                    resourceId: data.resourceId,
                    userId: principal.id,
                })
                socket.data.lockedResourceId = null
                if (released) {
                    websocketService.to(projectId).emit(WebsocketClientEvent.RESOURCE_UNLOCKED, {
                        resourceId: data.resourceId,
                    })
                }
            }
            catch (error) {
                app.log.error({ err: error }, '[UNLOCK_RESOURCE] Failed to release lock')
            }
        }
    })
}

function registerLockDisconnectHandler({ socket, userId, projectId, app }: RegisterDisconnectHandlerParams): void {
    if (socket.data.lockDisconnectRegistered) {
        return
    }
    socket.data.lockDisconnectRegistered = true
    socket.once('disconnect', async () => {
        const lockedResourceId = socket.data.lockedResourceId
        if (typeof lockedResourceId === 'string') {
            const released = await lockService(app.log).release({
                resourceId: lockedResourceId,
                userId,
            })
            if (released) {
                websocketService.to(projectId).emit(WebsocketClientEvent.RESOURCE_UNLOCKED, {
                    resourceId: lockedResourceId,
                })
            }
        }
    })
}

type RegisterDisconnectHandlerParams = {
    socket: { data: Record<string, unknown>, once: (event: string, handler: () => void) => void, id: string }
    userId: string
    projectId: string
    app: FastifyInstance
}
