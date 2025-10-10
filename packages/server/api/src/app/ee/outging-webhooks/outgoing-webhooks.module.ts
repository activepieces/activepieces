import { FastifyPluginAsync } from 'fastify'
import { outgoingWebhooksController } from './outgoing-webhooks.controller'

export const outgoingWebhooksModule: FastifyPluginAsync = async (app) => {
    await app.register(outgoingWebhooksController, { prefix: '/v1/outgoing-webhooks' })
}
