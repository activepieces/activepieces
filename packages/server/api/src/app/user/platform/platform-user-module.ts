import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformUserController } from './platform-user-controller'

export const platformUserModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformUserController, { prefix: '/v1/users' })
}
