import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
import { chatSessionController } from "./chat.session.controller"

export const quickModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(chatSessionController, { prefix: '/v1/chat-sessions' })
}