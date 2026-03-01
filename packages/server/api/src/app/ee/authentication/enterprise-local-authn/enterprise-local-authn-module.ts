import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { enterpriseLocalAuthnController } from './enterprise-local-authn-controller'

export const enterpriseLocalAuthnModule: FastifyPluginAsyncTypebox = async (
    app,
) => {
    await app.register(enterpriseLocalAuthnController, {
        prefix: '/v1/authn/local',
    })
}
