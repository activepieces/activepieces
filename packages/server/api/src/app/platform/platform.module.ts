import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformPieceFilterController } from './platform-piece-filter.controller'
import { platformController } from './platform.controller'

export const platformModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformController, { prefix: '/v1/platforms' })
    await app.register(platformPieceFilterController, { prefix: '/v1/platform-piece-filter' })
}
