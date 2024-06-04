import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { activationKeysController } from './activation-keys-controller'
export const activationKeysModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(activationKeysController, { prefix: '/v1/activation-keys' })
}