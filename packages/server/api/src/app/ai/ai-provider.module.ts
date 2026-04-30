import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { aiProviderController } from './ai-provider-controller'

export const aiProviderModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })
}
