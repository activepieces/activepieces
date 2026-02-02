import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { aiProviderController } from './ai-provider-controller'

export const aiProviderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })
}
