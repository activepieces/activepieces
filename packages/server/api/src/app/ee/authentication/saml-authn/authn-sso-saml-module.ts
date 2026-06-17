import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import cron from 'node-cron'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { authnSsoSamlController } from './authn-sso-saml-controller'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlModule: FastifyPluginAsyncZod = async (app) => {
    cron.schedule('0 * * * *', () => {
        rejectedPromiseHandler(authnSsoSamlService(app.log).expirePendingSsoDomains(), app.log)
    })
    await app.register(authnSsoSamlController, { prefix: '/v1/authn/saml' })
}
