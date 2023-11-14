import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { signingKeyController } from './signing-key-controller'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'

export const signingKeyModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('onRequest', platformMustBeOwnedByCurrentUser)
    await app.register(signingKeyController, { prefix: '/v1/signing-keys' })
}
