import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { webhookSimulationService } from './webhook-simulation-service'
import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'

export const webhookSimulationController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {
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

const CreateWebhookSimulationRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: Type.Object({
            flowId: Type.String(),
        }),
    },
}

const GetWebhookSimulationRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        querystring: Type.Object({
            flowId: Type.String(),
        }),
    },
}

const DeleteWebhookSimulationRequest = GetWebhookSimulationRequest
