import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { CreateWebhookSimulationRequest, DeleteWebhookSimulationRequest, GetWebhookSimulationRequest } from './webhook-simulation-dto'
import { webhookSimulationService } from './webhook-simulation-service'

export const webhookSimulationController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', CreateWebhookSimulationRequest, async (req) => {
        const { flowId } = req.body
        const { projectId } = req.principal

        return webhookSimulationService.create({
            flowId,
            projectId,
        })
    })

    app.get('/', GetWebhookSimulationRequest, async (req) => {
        const { flowId } = req.query
        const { projectId } = req.principal

        return webhookSimulationService.get({
            flowId,
            projectId,
        })
    })

    app.delete('/', DeleteWebhookSimulationRequest, async (req) => {
        const { flowId } = req.query
        const { projectId } = req.principal

        return webhookSimulationService.delete({
            flowId,
            projectId,
        })
    })

    done()
}
