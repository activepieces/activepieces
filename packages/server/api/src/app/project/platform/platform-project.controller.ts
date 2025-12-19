/*
This is a custom implementation to support platform projects with access control and other features.
The logic has been isolated to this file to avoid potential conflicts with the open-source modules from upstream
*/

import { ActivepiecesError, CreatePlatformProjectRequest, EndpointScope, ErrorCode, ListProjectRequestForPlatformQueryParams, PlatformRole, Principal, PrincipalType, ProjectType, ProjectWithLimits, SeekPage, ServicePrincipal, UpdateProjectPlatformRequest, UserPrincipal } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { projectService } from '../project-service'
import { enrichProject, platformProjectService } from './platform-project.service'

const CreateProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['projects'],
        response: {
            [StatusCodes.OK]: ProjectWithLimits,
        },
        body: CreatePlatformProjectRequest,
    },
}

const UpdateProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['projects'],
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: ProjectWithLimits,
        },
        body: UpdateProjectPlatformRequest,
    },
}

const ListProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['projects'],
        response: {
            [StatusCodes.OK]: SeekPage(ProjectWithLimits),
        },
        querystring: ListProjectRequestForPlatformQueryParams,
    },
}

const DeleteProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
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
            externalId: request.body.externalId ?? undefined,
            metadata: request.body.metadata ?? undefined,
            type: ProjectType.TEAM,
        })
        const projectWithUsage = await enrichProject(project, app.log)
        await reply.status(StatusCodes.CREATED).send(projectWithUsage)
    })

    // Overrides the same endpoint handler in the open source counter-part
    app.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService.getOneOrThrow(request.params.id)
        const haveTokenForTheProject = request.principal.projectId === project.id
        const ownThePlatform = await isPlatformAdmin(request.principal, project.platformId)
        if (!haveTokenForTheProject && !ownThePlatform) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {},
            })
        }
        return platformProjectService(request.log).update({
            platformId: request.principal.platform.id,
            projectId: request.params.id,
            request: {
                ...request.body,
                externalId: ownThePlatform ? request.body.externalId : undefined,
            },
        })
    })

    app.get('/', ListProjectRequest, async (request, _reply) => {
        const userId = await getUserId(request.principal)
        return platformProjectService(request.log).getAllForPlatform({
            platformId: request.principal.platform.id,
            externalId: request.query.externalId,
            cursorRequest: request.query.cursor ?? null,
            displayName: request.query.displayName,
            types: request.query.types,
            limit: request.query.limit ?? 50,
            userId,
            scope: EndpointScope.PLATFORM,
        })
    })

    app.delete('/:id', DeleteProjectRequest, async (request, reply) => {
        // await platformMustBeOwnedByCurrentUser.call(app, request, reply)
        assertProjectToDeleteIsNotPrincipalProject(request.principal, request.params.id)
        await assertProjectToDeleteIsNotPersonalProject(request.params.id)

        await platformProjectService(request.log).hardDelete({
            id: request.params.id,
        })

        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function getUserId(principal: Principal): Promise<string> {
    if (principal.type === PrincipalType.SERVICE) {
        const platform = await platformService.getOneOrThrow(principal.platform.id)
        return platform.ownerId
    }
    return principal.id
}

async function isPlatformAdmin(principal: ServicePrincipal | UserPrincipal, platformId: string): Promise<boolean> {
    if (principal.platform.id !== platformId) {
        return false
    }
    if (principal.type === PrincipalType.SERVICE) {
        return true
    }
    const user = await userService.getOneOrFail({
        id: principal.id,
    })
    return user.platformRole === PlatformRole.ADMIN
}

const assertProjectToDeleteIsNotPrincipalProject = (principal: ServicePrincipal | UserPrincipal, projectId: string): void => {
    if (principal.projectId === projectId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'ACTIVE_PROJECT',
            },
        })
    }
}

async function assertProjectToDeleteIsNotPersonalProject(projectId: string): Promise<void> {
    const project = await projectService.getOneOrThrow(projectId)
    if (project.type === ProjectType.PERSONAL) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Personal projects cannot be deleted',
            },
        })
    }
}
