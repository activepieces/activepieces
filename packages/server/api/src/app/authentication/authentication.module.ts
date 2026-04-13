import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { authenticationController } from './authentication.controller'
import { totpController } from './totp/totp.controller'

export const authenticationModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(authenticationController, {
        prefix: '/v1/authentication',
    })
    await app.register(totpController, {
        prefix: '/v1/authentication/2fa',
    })
}
