import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { chatController } from './chat-controller'

export const chatModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(chatController, { prefix: '/v1/chat' })
}
