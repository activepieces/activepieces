import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { authenticationController } from './authentication.controller'
import { betterAuthController } from './better-auth/better-auth-controller'
import { twoFactorController } from './two-factor/two-factor-controller'

export const authenticationModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(authenticationController, {
        prefix: '/v1/authentication',
    })
    await app.register(betterAuthController)
    await app.register(twoFactorController, { prefix: '/v1/authn/2fa' })
}
