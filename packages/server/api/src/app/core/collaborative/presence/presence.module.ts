import { isNil } from '@activepieces/core-utils'
import { PresenceRequest, PresenceUpdatedEvent, PrincipalType, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { Socket } from 'socket.io'
import { userService } from '../../../user/user-service'
import { websocketService } from '../../websockets.service'
import { collaborativeResource } from '../collaborative-resource'
import { presenceService } from './presence.service'

export const presenceModule: FastifyPluginAsyncZod = async (app) => {
    websocketService.onProjectLeave({
        name: 'presence',
        handler: ({ socket, userId }) => leavePresence({ socket, userId, app }),
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
                presenceBySocket.set(socket, { resourceId, projectId })

                const users = await presenceService(app.log).getActiveUsers({ resourceId, projectId })
                websocketService.to(projectId).emit(WebsocketClientEvent.PRESENCE_UPDATED, {
                    resourceId,
                    users,
                })

                callback?.({ users })
            }
            catch (error) {
                app.log.error({ error }, '[JOIN_PRESENCE] Failed to join presence')
                callback?.({ users: [] })
            }
        }
    }, { rejectResponse: NO_PRESENCE, orderedWithSwitch: true })
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
                presenceBySocket.delete(socket)

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
    }, { orderedWithSwitch: true })
}

const NO_PRESENCE: Pick<PresenceUpdatedEvent, 'users'> = { users: [] }

const presenceBySocket = new WeakMap<Socket, JoinedPresence>()

async function leavePresence({ socket, userId, app }: LeavePresenceParams): Promise<void> {
    const joined = presenceBySocket.get(socket)
    if (isNil(joined)) {
        return
    }
    const { resourceId, projectId } = joined
    await presenceService(app.log).leave({
        resourceId,
        projectId,
        userId,
    })
    presenceBySocket.delete(socket)
    const users = await presenceService(app.log).getActiveUsers({ resourceId, projectId })
    websocketService.to(projectId).emit(WebsocketClientEvent.PRESENCE_UPDATED, {
        resourceId,
        users,
    })
}

type JoinedPresence = {
    resourceId: string
    projectId: string
}

type LeavePresenceParams = {
    socket: Socket
    userId: string
    app: FastifyInstance
}
