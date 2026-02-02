import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { secretManagersController } from './secret-managers.controller'

export const secretManagersModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(secretManagersController, { prefix: '/v1/secret-managers' })
}
