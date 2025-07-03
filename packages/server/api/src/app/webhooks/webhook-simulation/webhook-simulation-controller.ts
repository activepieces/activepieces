import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { webhookSimulationService } from './webhook-simulation-service'

export const webhookSimulationController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {
    app.post('/', CreateWebhookSimulationRequest, async (req) => {
        const { flowId } = req.body
        const { projectId } = req.principal

        return webhookSimulationService(req.log).create({
            flowId,
            projectId,
        })
    })

    app.get('/', GetWebhookSimulationRequest, async (req) => {
        const { flowId } = req.query
        const { projectId } = req.principal

        return webhookSimulationService(req.log).getOrThrow({
            flowId,
            projectId,
        })
    })

    app.delete('/', DeleteWebhookSimulationRequest, async (req) => {
        const { flowId } = req.query
        const { projectId } = req.principal

        return webhookSimulationService(req.log).delete({
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
