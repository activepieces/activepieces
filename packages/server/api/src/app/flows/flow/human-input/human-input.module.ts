import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { chatController } from './chat-controller'
import { formController } from './form-controller'

export const humanInputModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(formController, { prefix: '/v1/human-input' })
    await app.register(chatController, { prefix: '/v1/human-input' })
}