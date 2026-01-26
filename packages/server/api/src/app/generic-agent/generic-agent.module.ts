import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { chatSessionController } from './session/chat.session.controller'
import { genericAgentController } from './generic-agent.controller'

export const genericAgentModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(genericAgentController, { prefix: '/v1/generic-agent' })
    await app.register(chatSessionController, { prefix: '/v1/chat-sessions' })
}

