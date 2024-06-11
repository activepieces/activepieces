import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { projectMemberService } from './project-member.service'
import {
    ListProjectMembersRequestQuery,
    ProjectMember,
    ProjectMemberWithUser,
    UpsertProjectMemberRequestBody,
} from '@activepieces/ee-shared'
import {
    Permission,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'

const DEFAULT_LIMIT_SIZE = 10

export const projectMemberController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', UpsertProjectMemberRequest, async (request, reply) => {
        const { userId, projectId, role } = request.body
        const projectMember = await projectMemberService.upsert({
            userId,
            projectId,
            role,
        })
        await reply.status(StatusCodes.CREATED).send(projectMember)
    })


    app.get('/', ListProjectMembersRequestQueryOptions, async (request) => {
        return projectMemberService.list(
            request.principal.projectId,
            request.query.cursor ?? null,
            request.query.limit ?? DEFAULT_LIMIT_SIZE,
        )
    })

    app.delete('/:id', DeleteProjectMemberRequest, async (request, reply) => {
        await projectMemberService.delete(
            request.principal.projectId,
            request.params.id,
        )
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const UpsertProjectMemberRequest = {
    config: {
        allowedPrincipals: [PrincipalType.SERVICE],
        permission: Permission.WRITE_PROJECT_MEMBER,
    },
    schema: {
        tags: ['project-members'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: UpsertProjectMemberRequestBody,
        response: {
            [StatusCodes.CREATED]: ProjectMember,
        },
    },
}

const ListProjectMembersRequestQueryOptions = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_PROJECT_MEMBER,
    },
    schema: {
        tags: ['project-members'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListProjectMembersRequestQuery,
        responnse: {
            [StatusCodes.OK]: SeekPage(ProjectMemberWithUser),
        },
    },
}

const DeleteProjectMemberRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_PROJECT_MEMBER,
    },
    schema: {
        tags: ['project-members'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
