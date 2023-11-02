import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { signingKeyController } from './signing-key-controller'

export const signingKeyModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(signingKeyController, { prefix: '/v1/signing-keys' })
}
