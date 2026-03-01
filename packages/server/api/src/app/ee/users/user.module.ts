import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { usersController } from './users-controller'

export const userModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(usersController, { prefix: '/v1/users' })
}

