import { projectAccess, ProjectResourceType, publicPlatformAccess } from '@activepieces/server-shared'
import { PrincipalType, Project, UpdateProjectRequestInCommunity } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { projectService } from './project-service'

export const userProjectController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/:id', {
        config: {
            security: projectAccess([PrincipalType.USER], undefined, {
                type: ProjectResourceType.PARAM,
                paramKey: 'id',
            }),
        },
    }, async (request) => {
        return projectService.getOneOrThrow(request.principal.projectId)
    })

    fastify.get('/', {
        config: {
            security: publicPlatformAccess([PrincipalType.USER]),
        },
    }, async (request) => {
        return paginationHelper.createPage([await projectService.getUserProjectOrThrow(request.principal.id)], null)
    })
}

export const projectController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService.getOneOrThrow(request.params.id)
        return projectService.update(request.params.id, {
            type: project.type,
            ...request.body,
        })
    })
}

const UpdateProjectRequest = {
    config: {
        security: publicPlatformAccess([PrincipalType.USER, PrincipalType.SERVICE]),
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
