import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { authnSsoSamlController } from './authn-sso-saml-controller'

export const authnSsoSamlModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(authnSsoSamlController, { prefix: '/v1/authn/saml' })
}
