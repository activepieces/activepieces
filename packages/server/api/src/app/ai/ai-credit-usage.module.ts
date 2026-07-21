import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { aiCreditUsageController } from './ai-credit-usage-controller'

export const aiCreditUsageModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(aiCreditUsageController, { prefix: '/v1/ai-credit-usage' })
}
