import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { chatController } from './chat-controller'
import { chatVisibilityGuard } from './chat-visibility-helper'

export const chatModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', chatVisibilityGuard)
    await app.register(chatController, { prefix: '/v1/chat' })
}
