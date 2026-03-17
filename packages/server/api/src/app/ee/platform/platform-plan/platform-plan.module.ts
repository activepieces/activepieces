import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformPlanController } from './platform-plan.controller'
import { stripeBillingController } from './stripe-billing.controller'

export const platformPlanModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformPlanController, { prefix: '/v1/platform-billing' })
    await app.register(stripeBillingController, { prefix: '/v1/stripe-billing' })
}