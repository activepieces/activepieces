import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { usersController } from './user-controller'

export const userModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(usersController, { prefix: '/v1/users' })
}
