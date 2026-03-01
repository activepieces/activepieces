import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { chatController } from './chat-controller'
import { formController } from './form-controller'

export const humanInputModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(formController, { prefix: '/v1/human-input' })
    await app.register(chatController, { prefix: '/v1/human-input' })
}