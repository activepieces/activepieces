import { ChatSessionEnded, ChatSessionUpdate, EmitAgentProgressRequest, PrincipalType, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../core/websockets.service'
import { chatSessionController } from './session/chat.session.controller'
import { chatSessionService } from './session/chat.session.service'

export const quickModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(chatSessionController, { prefix: '/v1/chat-sessions' })
    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.EMIT_AGENT_PROGRESS, (socket) => {
        return async (data: EmitAgentProgressRequest, _principal, _projectId, callback?: (data?: unknown) => void): Promise<void> => {
            switch (data.event) {
                case WebsocketClientEvent.AGENT_STREAMING_UPDATE: {
                    const chatUpdate: ChatSessionUpdate = {
                        sessionId: data.data.sessionId,
                        part: data.data.part,
                    }
                    socket.to(data.userId).emit(data.event, chatUpdate)
                    break
                }
                case WebsocketClientEvent.AGENT_STREAMING_ENDED: {
                    const chatEnded: ChatSessionEnded = {
                        sessionId: data.data.session.id,
                    }
                    await chatSessionService(app.log).update({ id: data.data.session.id, userId: data.userId, session: data.data.session })
                    socket.to(data.userId).emit(data.event, chatEnded)
                    break
                }
            }
            callback?.()
        }
    })
}

