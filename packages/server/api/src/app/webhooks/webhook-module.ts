import { FastifyPluginAsync } from 'fastify'
import { webhookController } from './webhook-controller'
import { webhookSimulationController } from './webhook-simulation/webhook-simulation-controller'

export const webhookModule: FastifyPluginAsync = async (app) => {
    await app.register(webhookController, { prefix: '/v1/webhooks' })
    await app.register(webhookSimulationController, {
        prefix: '/v1/webhook-simulation',
    })
}
