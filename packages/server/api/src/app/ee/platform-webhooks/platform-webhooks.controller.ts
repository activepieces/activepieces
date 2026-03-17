import { CreatePlatformEventDestinationRequestBody, EventDestination, ListPlatformEventDestinationsRequestBody, PrincipalType, SeekPage, TestPlatformEventDestinationRequestBody, UpdatePlatformEventDestinationRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { eventDestinationService } from '../../event-destinations/event-destinations.service'

export const platformWebhooksController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', CreateEventDestinationRequest, async (req) => {
        return eventDestinationService(req.log).create(req.body, req.principal.platform.id)
    })

    app.patch('/:id', UpdateEventDestinationRequest, async (req) => {
        return eventDestinationService(req.log).update({
            id: req.params.id,
            platformId: req.principal.platform.id,
            request: req.body,
        })
    })
    app.get('/', ListEventDestinationsRequest, async (req) => {
        return eventDestinationService(req.log).list({
            platformId: req.principal.platform.id,
            cursorRequest: req.query.cursor ?? null,
            limit: req.query.limit ?? 10,
        })
    })
    app.delete('/:id', DeleteEventDestinationRequest, async (req) => {
        return eventDestinationService(req.log).delete({
            id: req.params.id,
            platformId: req.principal.platform.id,
        })
    })

    app.post('/test', TestPlatformEventDestinationRequest, async (req) => {
        return eventDestinationService(req.log).test({
            platformId: req.principal.platform.id,
            projectId: undefined,
            url: req.body.url,
        })
    })
}

export const CreateEventDestinationRequest = {
    schema: {
        body: CreatePlatformEventDestinationRequestBody,
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
}

export const UpdateEventDestinationRequest = {
    schema: {
        body: UpdatePlatformEventDestinationRequestBody,
        params: z.object({
            id: z.string(),
        }),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
}

export const ListEventDestinationsRequest = {
    schema: {
        querystring: ListPlatformEventDestinationsRequestBody,
        response: {
            [StatusCodes.OK]: SeekPage(EventDestination),
        },
        tags: ['event-destinations'],
        description: 'List event destinations',
    },
    response: {
        [StatusCodes.OK]: SeekPage(EventDestination),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
}

export const DeleteEventDestinationRequest = {
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
}

export const TestPlatformEventDestinationRequest = {
    schema: {
        body: TestPlatformEventDestinationRequestBody,
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

