import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { managedAuthnController } from './managed-authn-controller'

export const managedAuthnModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(managedAuthnController, { prefix: '/v1/managed-authn' })
}
