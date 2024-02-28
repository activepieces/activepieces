import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformController } from './platform.controller'

export const platformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformController, { prefix: '/v1/platforms' })
}
