import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { enterpriseLocalAuthnController } from './enterprise-local-authn-controller'

export const enterpriseLocalAuthnModule: FastifyPluginAsyncZod = async (
    app,
) => {
    await app.register(enterpriseLocalAuthnController, {
        prefix: '/v1/authn/local',
    })
}
