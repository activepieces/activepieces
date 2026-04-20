import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { authenticationController } from './authentication.controller'
import { betterAuthController } from './better-auth/better-auth-controller'

export const authenticationModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(authenticationController, {
        prefix: '/v1/authentication',
    })
    await app.register(betterAuthController)
}
