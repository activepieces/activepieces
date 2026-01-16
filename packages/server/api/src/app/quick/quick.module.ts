import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { EmitAgentProgressRequest, PrincipalType, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { websocketService } from '../core/websockets.service'
import { chatSessionController } from './session/chat.session.controller'

export const quickModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(chatSessionController, { prefix: '/v1/chat-sessions' })
    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.EMIT_AGENT_PROGRESS, (socket) => {
        return async (data: EmitAgentProgressRequest, _principal, _projectId, callback?: (data?: unknown) => void): Promise<void> => {
            socket.to(data.userId).emit(data.event, data.data)
            callback?.()
        }
    })
}

