import { CreatePlatformOutgoingWebhookRequestBody, ListPlatformOutgoingWebhooksRequestBody, OutgoingWebhook, TestPlatformOutgoingWebhookRequestBody, UpdatePlatformOutgoingWebhookRequestBody } from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { EndpointScope, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { outgoingWebhookService } from '../../outgoing-webhooks/outgoing-webhooks.service'

export const platformWebhooksController: FastifyPluginAsyncTypebox = async (app) => {
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

    app.post('/test', TestPlatformOutgoingWebhookRequest, async (req) => {
        return outgoingWebhookService(req.log).test({
            platformId: req.principal.platform.id,
            projectId: undefined,
            url: req.body.url,
        })
    })
}

export const CreateOutgoingWebhookRequest = {
    schema: {
        body: CreatePlatformOutgoingWebhookRequestBody,
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

export const UpdateOutgoingWebhookRequest = {
    schema: {
        body: UpdatePlatformOutgoingWebhookRequestBody,
        params: Type.Object({
            id: Type.String(),
        }),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

export const ListOutgoingWebhooksRequest = {
    schema: {
        querystring: ListPlatformOutgoingWebhooksRequestBody,
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
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
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
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

export const TestPlatformOutgoingWebhookRequest = {
    schema: {
        body: TestPlatformOutgoingWebhookRequestBody,
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
        allowedPrincipals: [PrincipalType.USER],
        scope: EndpointScope.PLATFORM,
    },
}

