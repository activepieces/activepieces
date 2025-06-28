import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { formController } from './form-controller'
import { chatController } from './chat-controller'

export const humanInputModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(formController, { prefix: '/v1/human-input' })
    await app.register(chatController, { prefix: '/v1/human-input' })
}