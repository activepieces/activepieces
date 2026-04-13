import { ApId, PrincipalType, Project, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, UpdateProjectRequestInCommunity } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { projectService } from './project-service'

export const projectController: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService(request.log).getOneOrThrow(request.params.id)
        return projectService(request.log).update(request.params.id, {
            type: project.type,
            ...request.body,
        })
    })

    fastify.get('/:id', GetProjectRequest, async (request) => {
        return projectService(request.log).getOneOrThrow(request.projectId)
    })

    fastify.get('/', ListProjectsRequest, async (request) => {
        return paginationHelper.createPage([await projectService(request.log).getUserProjectOrThrow(request.principal.id)], null)
    })
}

const UpdateProjectRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['projects'],
        params: z.object({
            id: z.string(),
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
        params: z.object({
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