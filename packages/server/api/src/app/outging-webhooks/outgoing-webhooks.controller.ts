import { CreateOutgoingWebhookRequestBody, ListOutgoingWebhooksRequestBody, OutgoingWebhook, UpdateOutgoingWebhookRequestBody } from '@activepieces/ee-shared'
import { EndpointScope, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { outgoingWebhookService } from './outgoing-webhooks.service'
import { StatusCodes } from 'http-status-codes'

export const outgoingWebhooksController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateOutgoingWebhookRequest, async (req) => {
        return outgoingWebhookService(req.log).create(req.body, req.principal.platform.id)
    })
    app.patch('/:id', UpdateOutgoingWebhookRequest, async (req) => {
        return outgoingWebhookService(req.log).update({
            id: req.params.id,
            platformId: req.principal.platform.id,
            request: req.body,
        })
    })
    app.get('/', ListOutgoingWebhooksRequest, async (req) => {
        return outgoingWebhookService(req.log).list({
            platformId: req.principal.platform.id,
            cursorRequest: req.query.cursor ?? null,
            limit: req.query.limit ?? 10,
        })
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

export const UpdateOutgoingWebhookRequest = {
    schema: {
        body: UpdateOutgoingWebhookRequestBody,
        params: Type.Object({
            id: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

export const ListOutgoingWebhooksRequest = {
    schema: {
        querystring: ListOutgoingWebhooksRequestBody,
        response: {
            [StatusCodes.OK]: SeekPage(OutgoingWebhook),
        },
        tags: ['outgoing-webhooks'],
        description: 'List outgoing webhooks',
    },
    response: {
        [StatusCodes.OK]: SeekPage(OutgoingWebhook),
    },
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

