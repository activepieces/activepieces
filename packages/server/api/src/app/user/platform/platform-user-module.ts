import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformUserController } from './platform-user-controller'

export const platformUserModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformUserController, { prefix: '/v1/users' })
}
