import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { credentialProxyController } from './credential-proxy.controller'

export const credentialProxyModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(credentialProxyController, {
        prefix: '/v1/credential-proxy',
    })
}
