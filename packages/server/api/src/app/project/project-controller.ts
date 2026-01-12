import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { PrincipalType, Project, UpdateProjectRequestInCommunity } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { projectService } from './project-service'

export const projectController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService.getOneOrThrow(request.params.id)
        return projectService.update(request.params.id, {
            type: project.type,
            ...request.body,
        })
    })

    fastify.get('/:id', {
        config: {
            security: securityAccess.project([PrincipalType.USER], undefined, {
                type: ProjectResourceType.PARAM,
                paramKey: 'id',
            }),
        },
    }, async (request) => {
        return projectService.getOneOrThrow(request.projectId)
    })

    fastify.get('/', {
        config: {
            security: securityAccess.publicPlatform([PrincipalType.USER]),
        },
    }, async (request) => {
        return paginationHelper.createPage([await projectService.getUserProjectOrThrow(request.principal.id)], null)
    })
}

const UpdateProjectRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
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
