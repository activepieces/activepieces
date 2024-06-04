import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { activationKeysController } from './activation-keys-controller'
import { activationKeysService } from './activation-keys-service'
export const activationKeysModule: FastifyPluginAsyncTypebox = async (app) => {
    await activationKeysService.init()
    await app.register(activationKeysController, { prefix: '/v1/activation-keys' })
}