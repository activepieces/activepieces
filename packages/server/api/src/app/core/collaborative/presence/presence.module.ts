import { isNil } from '@activepieces/core-utils'
import { PresenceRequest, PrincipalType, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { Socket } from 'socket.io'
import { userService } from '../../../user/user-service'
import { websocketService } from '../../websockets.service'
import { collaborativeResource } from '../collaborative-resource'
import { presenceService } from './presence.service'

export const presenceModule: FastifyPluginAsyncZod = async (app) => {
    websocketService.setProjectLeaveHandler({
        name: 'presence',
        handler: ({ socket, userId, projectId }) => leavePresence({ socket, userId, projectId, app }),
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.JOIN_PRESENCE, (socket) => {
        return async (data: unknown, principal, projectId, callback) => {
            const request = PresenceRequest.safeParse(data)
            if (!request.success) {
                callback?.({ users: [] })
                return
            }
            const { resourceId } = request.data
            try {
                const resource = await collaborativeResource.resolve({ resourceId, projectId })
                if (isNil(resource)) {
                    app.log.warn({ resourceId, user: { id: principal.id }, project: { id: projectId } }, '[JOIN_PRESENCE] Denied: resource does not belong to this project')
                    callback?.({ users: [] })
                    return
                }

                const user = await userService(app.log).getMetaInformation({ id: principal.id })
                const displayName = `${user.firstName} ${user.lastName}`

                await presenceService(app.log).join({
                    resourceId,
                    projectId,
                    userId: principal.id,
                    userDisplayName: displayName,
                    userEmail: user.email,
                    userImageUrl: user.imageUrl ?? null,
                })
                socket.data.presenceResourceId = resourceId

                const users = await presenceService(app.log).getActiveUsers({ resourceId, projectId })
                websocketService.to(projectId).emit(WebsocketClientEvent.PRESENCE_UPDATED, {
                    resourceId,
                    users,
                })

                registerPresenceDisconnectHandler({ socket, userId: principal.id, app })

                callback?.({ users })
            }
            catch (error) {
                app.log.error({ error }, '[JOIN_PRESENCE] Failed to join presence')
                callback?.({ users: [] })
            }
        }
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.LEAVE_PRESENCE, (socket) => {
        return async (data: unknown, principal, projectId) => {
            const request = PresenceRequest.safeParse(data)
            if (!request.success) {
                return
            }
            const { resourceId } = request.data
            try {
                await presenceService(app.log).leave({
                    resourceId,
                    projectId,
                    userId: principal.id,
                })
                socket.data.presenceResourceId = null

                const users = await presenceService(app.log).getActiveUsers({ resourceId, projectId })
                websocketService.to(projectId).emit(WebsocketClientEvent.PRESENCE_UPDATED, {
                    resourceId,
                    users,
                })
            }
            catch (error) {
                app.log.error({ error }, '[LEAVE_PRESENCE] Failed to leave presence')
            }
        }
    })
}

function registerPresenceDisconnectHandler({ socket, userId, app }: RegisterDisconnectHandlerParams): void {
    if (socket.data.presenceDisconnectRegistered) {
        return
    }
    socket.data.presenceDisconnectRegistered = true
    socket.once('disconnect', async () => {
        const projectId = websocketService.getProjectId(socket)
        if (isNil(projectId)) {
            return
        }
        await leavePresence({ socket, userId, projectId, app })
    })
}

async function leavePresence({ socket, userId, projectId, app }: LeavePresenceParams): Promise<void> {
    const presenceResourceId = socket.data.presenceResourceId
    if (typeof presenceResourceId !== 'string') {
        return
    }
    await presenceService(app.log).leave({
        resourceId: presenceResourceId,
        projectId,
        userId,
    })
    socket.data.presenceResourceId = null
    const users = await presenceService(app.log).getActiveUsers({ resourceId: presenceResourceId, projectId })
    websocketService.to(projectId).emit(WebsocketClientEvent.PRESENCE_UPDATED, {
        resourceId: presenceResourceId,
        users,
    })
}

type RegisterDisconnectHandlerParams = {
    socket: Socket
    userId: string
    app: FastifyInstance
}

type LeavePresenceParams = {
    socket: Socket
    userId: string
    projectId: string
    app: FastifyInstance
}
