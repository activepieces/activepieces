import { PrincipalType, Project, UpdateProjectRequestInCommunity } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { projectService } from './project-service'
import { AuthorizationType, RouteKind } from '@activepieces/server-shared'

export const userProjectController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/:id', GetUserProjectRequest, async (request) => {
        return projectService.getOneOrThrow(request.principal.projectId)
    })

    fastify.get('/', ListUserProjectsRequest, async (request) => {
        return paginationHelper.createPage([await projectService.getUserProjectOrThrow(request.principal.id)], null)
    })
}


const GetUserProjectRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PLATFORM,
                allowedPrincipals: [PrincipalType.USER] as const,
            },
        } as const,
    },
}

const ListUserProjectsRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PLATFORM,
                allowedPrincipals: [PrincipalType.USER] as const,
            },
        } as const,
    },
}

export const projectController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/:id', UpdateProjectRequest, async (request) => {
        return projectService.update(request.params.id, request.body)
    })
}

const UpdateProjectRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PLATFORM,
                allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
            },
        } as const,
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
