import { Type } from '@sinclair/typebox'

export const CreateWebhookSimulationRequest = {
    schema: {
        body: Type.Object({
            flowId: Type.String(),
        }),
    },
}

export const GetWebhookSimulationRequest = {
    schema: {
        querystring: Type.Object({
            flowId: Type.String(),
        }),
    },
}

export const DeleteWebhookSimulationRequest = GetWebhookSimulationRequest
