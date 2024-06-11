import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { licenseKeysController } from './license-keys-controller'
export const licenseKeysModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(licenseKeysController, { prefix: '/v1/license-keys' })
}