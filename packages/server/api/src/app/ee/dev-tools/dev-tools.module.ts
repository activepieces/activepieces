import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { devToolsController } from './dev-tools.controller'

export const devToolsModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(devToolsController, { prefix: '/v1/dev-tools' })
}
