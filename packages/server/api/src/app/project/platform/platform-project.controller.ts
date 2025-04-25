/*
This is a custom implementation to support platform projects with access control and other features.
The logic has been isolated to this file to avoid potential conflicts with the open-source modules from upstream
*/

import { ActivepiecesError, CreatePlatformProjectRequest, EndpointScope, ErrorCode, PrincipalType, Project, SeekPage, UpdateProjectRequestInCommunity } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../project-service'
import { platformProjectService } from './platform-project.service'

const CreateProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['projects'],
        response: {
            [StatusCodes.OK]: Project,
        },
        body: CreatePlatformProjectRequest,
    },
}

const UpdateProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['projects'],
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: Project,
        },
        body: UpdateProjectRequestInCommunity,
    },
}

const ListProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['projects'],
        response: {
            [StatusCodes.OK]: SeekPage(Project),
        },
        querystring: Type.Object({
            externalId: Type.Optional(Type.String()),
            limit: Type.Optional(Type.Number({})),
            cursor: Type.Optional(Type.String({})),
        }),
    },
}

const DeleteProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        tags: ['projects'],
    },
}


export const platformProjectController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateProjectRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const platform = await platformService.getOneOrThrow(platformId)
        const project = await projectService.create({
            platformId,
            ownerId: platform.ownerId,
            displayName: request.body.displayName,
            externalId: request.body.externalId,
            metadata: request.body.metadata,
        })
        await reply.status(StatusCodes.CREATED).send(project)
    })

    // Overrides the same endpoint handler in the open source counter-part
    app.post('/:id', UpdateProjectRequest, async (request) => {
        return projectService.update(request.params.id, request.body)
    })

    app.get('/', ListProjectRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const platform = await platformService.getOneOrThrow(platformId)
        const projects = await projectService.getAllForUser({ platformId, userId: platform.ownerId })
        await reply.status(StatusCodes.CREATED).send(projects)
    })

    app.delete('/:id', DeleteProjectRequest, async (request, reply) => {
        // await platformMustBeOwnedByCurrentUser.call(app, request, reply)

        // Disallow deleting the active project
        if (request.principal.projectId === request.params.id) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'ACTIVE_PROJECT',
                },
            })
        }

        await platformProjectService(request.log).hardDelete({
            id: request.params.id,
        })

        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}
