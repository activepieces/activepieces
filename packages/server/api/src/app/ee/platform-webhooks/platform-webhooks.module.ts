import { FastifyPluginAsync } from 'fastify'
import { platformWebhooksController } from './platform-webhooks.controller'

export const platformWebhooksModule: FastifyPluginAsync = async (app) => {
    await app.register(platformWebhooksController, { prefix: '/v1/event-destinations' })
}

