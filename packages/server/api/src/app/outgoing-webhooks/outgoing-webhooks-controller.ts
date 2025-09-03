import { CreateOutgoingWebhookRequestBody } from '@activepieces/ee-shared'
import { EndpointScope, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { outgoingWebhookService } from './outgoing-webhooks-service'

export const outgoingWebhooksController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateOutgoingWebhookRequest, async (req) => {
        return outgoingWebhookService(req.log).create(req.body, req.principal.platform.id)
    })
    app.get('/', ListOutgoingWebhooksRequest, async (req) => {
        return outgoingWebhookService(req.log).list(req.principal.platform.id)
    })
    app.delete('/:id', DeleteOutgoingWebhookRequest, async (req) => {
        return outgoingWebhookService(req.log).delete({
            id: req.params.id,
            platformId: req.principal.platform.id,
        })
    })
}

export const CreateOutgoingWebhookRequest = {
    schema: {
        body: CreateOutgoingWebhookRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

export const ListOutgoingWebhooksRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

export const DeleteOutgoingWebhookRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}
