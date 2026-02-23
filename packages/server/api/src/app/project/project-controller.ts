import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { ApId, PrincipalType, Project, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, UpdateProjectRequestInCommunity } from '@activepieces/shared'
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

    fastify.get('/:id', GetProjectRequest, async (request) => {
        return projectService.getOneOrThrow(request.projectId)
    })

    fastify.get('/', ListProjectsRequest, async (request) => {
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


const GetProjectRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.PARAM,
            paramKey: 'id',
        }),
    },
    schema: {
        tags: ['projects'],
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: Project,
        },
    },
}   

const ListProjectsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['projects'],
        response: {
            [StatusCodes.OK]: SeekPage(Project),
        },
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}   