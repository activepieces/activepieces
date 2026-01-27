import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
import { chatSessionController } from "./session/chat.session.controller"
import { chatConversationController } from "./conversation/chat.conversation.controller"

export const quickModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(chatSessionController, { prefix: '/v1/chat-sessions' })
    await app.register(chatConversationController, { prefix: '/v1/chat-conversations' })
}