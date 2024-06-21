import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { authnSsoSamlController } from './authn-sso-saml-controller'

export const authnSsoSamlModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(authnSsoSamlController, { prefix: '/v1/authn/saml' })
}
