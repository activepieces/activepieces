import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { clientActivationKeysController } from './client-activation-keys-controller'

export const clientActivationKeysModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(clientActivationKeysController, { prefix: '/v1/activation-keys' })
}