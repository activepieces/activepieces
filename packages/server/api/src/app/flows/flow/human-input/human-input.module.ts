import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { humanInputController } from './human-input.controller'

export const humanInputModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(humanInputController, { prefix: '/v1/human-input' })
}
