import { PresenceRequest, PrincipalType, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { userService } from '../../../user/user-service'
import { websocketService } from '../../websockets.service'
import { presenceService } from './presence.service'

export const presenceModule: FastifyPluginAsyncZod = async (app) => {
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.JOIN_PRESENCE, (socket) => {
        return async (data: PresenceRequest, principal, projectId, callback) => {
            try {
                const user = await userService(app.log).getMetaInformation({ id: principal.id })
                const displayName = `${user.firstName} ${user.lastName}`

                await presenceService(app.log).join({
                    resourceId: data.resourceId,
                    userId: principal.id,
                    userDisplayName: displayName,
                    userEmail: user.email,
                    userImageUrl: user.imageUrl ?? null,
                })
                socket.data.presenceResourceId = data.resourceId

                const users = await presenceService(app.log).getActiveUsers({ resourceId: data.resourceId })
                websocketService.to(projectId).emit(WebsocketClientEvent.PRESENCE_UPDATED, {
                    resourceId: data.resourceId,
                    users,
                })

                registerPresenceDisconnectHandler({ socket, userId: principal.id, projectId, app })

                callback?.({ users })
            }
            catch (error) {
                app.log.error({ err: error }, '[JOIN_PRESENCE] Failed to join presence')
                callback?.({ users: [] })
            }
        }
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.LEAVE_PRESENCE, (socket) => {
        return async (data: PresenceRequest, principal, projectId) => {
            try {
                await presenceService(app.log).leave({
                    resourceId: data.resourceId,
                    userId: principal.id,
                })
                socket.data.presenceResourceId = null

                const users = await presenceService(app.log).getActiveUsers({ resourceId: data.resourceId })
                websocketService.to(projectId).emit(WebsocketClientEvent.PRESENCE_UPDATED, {
                    resourceId: data.resourceId,
                    users,
                })
            }
            catch (error) {
                app.log.error({ err: error }, '[LEAVE_PRESENCE] Failed to leave presence')
            }
        }
    })
}

function registerPresenceDisconnectHandler({ socket, userId, projectId, app }: RegisterDisconnectHandlerParams): void {
    if (socket.data.presenceDisconnectRegistered) {
        return
    }
    socket.data.presenceDisconnectRegistered = true
    socket.once('disconnect', async () => {
        const presenceResourceId = socket.data.presenceResourceId
        if (typeof presenceResourceId === 'string') {
            await presenceService(app.log).leave({
                resourceId: presenceResourceId,
                userId,
            })
            const users = await presenceService(app.log).getActiveUsers({ resourceId: presenceResourceId })
            websocketService.to(projectId).emit(WebsocketClientEvent.PRESENCE_UPDATED, {
                resourceId: presenceResourceId,
                users,
            })
        }
    })
}

type RegisterDisconnectHandlerParams = {
    socket: { data: Record<string, unknown>, once: (event: string, handler: () => void) => void, id: string }
    userId: string
    projectId: string
    app: FastifyInstance
}
