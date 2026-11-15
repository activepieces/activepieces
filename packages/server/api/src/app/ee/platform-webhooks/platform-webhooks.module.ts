import { FastifyPluginAsync } from 'fastify'
import { eventDestinationService } from '../../event-destinations/event-destinations.service'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { platformWebhooksController } from './platform-webhooks.controller'

export const platformWebhooksModule: FastifyPluginAsync = async (app) => {
    eventDestinationService(app.log).setup()
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.eventStreamingEnabled))
    await app.register(platformWebhooksController, { prefix: '/v1/event-destinations' })
}
