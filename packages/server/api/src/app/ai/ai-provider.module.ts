import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { aiProviderController } from './ai-provider-controller'
import { aiUsageController } from './ai-usage-controller'

export const aiProviderModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })
    await app.register(aiUsageController, { prefix: '/v1/ai-usage' })
}
