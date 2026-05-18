import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { managedAuthnController } from './managed-authn-controller'

export const managedAuthnModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(managedAuthnController, { prefix: '/v1/managed-authn' })
}
