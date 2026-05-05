import { FastifyPluginAsync } from 'fastify'
import { platformWebhooksController } from './platform-webhooks.controller'
import { eventDestinationService } from 'src/app/event-destinations/event-destinations.service'

export const platformWebhooksModule: FastifyPluginAsync = async (app) => {
    eventDestinationService(app.log).setup()
    await app.register(platformWebhooksController, { prefix: '/v1/event-destinations' })
}

