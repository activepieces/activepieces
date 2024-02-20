import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { federatedAuthnController } from './federated-authn-controller'

export const federatedAuthModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(federatedAuthnController, {
        prefix: '/v1/authn/federated',
    })
}
