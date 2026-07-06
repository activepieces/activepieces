import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { usersController } from './users-controller'

export const userModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(usersController, { prefix: '/v1/users' })
}

