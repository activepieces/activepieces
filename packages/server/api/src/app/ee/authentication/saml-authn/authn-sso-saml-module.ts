import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustHaveFeatureEnabled } from '../ee-authorization'
import { authnSsoSamlController } from './authn-sso-saml-controller'

export const authnSsoSamlModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.ssoEnabled))
    await app.register(authnSsoSamlController, { prefix: '/v1/authn/saml' })
}
