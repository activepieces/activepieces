import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformController } from './platform.controller'

export const platformModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformController, { prefix: '/v1/platforms' })
}
