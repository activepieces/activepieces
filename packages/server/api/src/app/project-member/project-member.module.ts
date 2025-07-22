import { ListProjectMemberQueryParams, PrincipalType, ProjectMember, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { projectMemberService } from './project-member.service'

export const projectMemberModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(projectMemberController, { prefix: '/v1/project-members' })
}

const projectMemberController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListProjectMemberRequest, async (request) => {
        return projectMemberService.list({
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? 50,
        })
    })

    app.delete('/:id', DeleteProjectMemberRequest, async (request, reply) => {
        await projectMemberService.delete({
            projectId: request.principal.projectId,
            projectMemberId: request.params.id,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const ListProjectMemberRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
    schema: {
        tags: ['project-member'],
        querystring: ListProjectMemberQueryParams,
        response: {
            [StatusCodes.OK]: SeekPage(ProjectMember),
        },
    },
}

const DeleteProjectMemberRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        tags: ['project-member'],
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
