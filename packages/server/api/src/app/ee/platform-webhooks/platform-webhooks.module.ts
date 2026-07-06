import { FastifyPluginAsync } from 'fastify'
import { eventDestinationService } from '../../event-destinations/event-destinations.service'
import { platformWebhooksController } from './platform-webhooks.controller'

export const platformWebhooksModule: FastifyPluginAsync = async (app) => {
    eventDestinationService(app.log).setup()
    await app.register(platformWebhooksController, { prefix: '/v1/event-destinations' })
}

