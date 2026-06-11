import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { oidcTokenController } from './oidc-token.controller'

export const oidcModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(oidcTokenController, { prefix: '/v1/worker' })
}
