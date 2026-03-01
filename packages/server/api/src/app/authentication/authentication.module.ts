import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { authenticationController } from './authentication.controller'

export const authenticationModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(authenticationController, {
        prefix: '/v1/authentication',
    })
}
