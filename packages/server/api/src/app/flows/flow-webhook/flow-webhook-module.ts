import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowWebhookController } from './flow-webhook-controller'

export const flowWebhookModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowWebhookController, { prefix: '/v1/flow-webhook' })
}