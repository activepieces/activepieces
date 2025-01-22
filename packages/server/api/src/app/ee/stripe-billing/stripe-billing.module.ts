import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { stripeBillingController } from './stripe-billing.controller'

export const stripeBillingModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(stripeBillingController, { prefix: '/v1/stripe-billing' })
}