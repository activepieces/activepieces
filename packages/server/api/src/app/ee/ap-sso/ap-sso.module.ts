import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { apSsoController } from './ap-sso.controller'

export const apSsoModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(apSsoController, { prefix: '/ap-sso' })
}
