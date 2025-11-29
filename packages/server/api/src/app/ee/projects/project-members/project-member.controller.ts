import {
    GetCurrentProjectMemberRoleRequestQuery,
    ListProjectMembersRequestQuery,
    ProjectMemberWithUser,
    UpdateProjectMemberRoleRequestBody,
} from '@activepieces/ee-shared'
import {
    Permission,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { projectMemberService } from './project-member.service'
import { projectAccess, ProjectResourceType, RouteKind } from '@activepieces/server-shared'
import { ProjectMemberEntity } from './project-member.entity'

const DEFAULT_LIMIT_SIZE = 10

export const projectMemberController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.get('/role', GetCurrentProjectMemberRoleRequest, async (request) => {
        return  projectMemberService(request.log).getRole({
            projectId: request.query.projectId,
            userId: request.principal.id,
        })
    })

    app.get('/', ListProjectMembersRequestQueryOptions, async (request) => {
        return projectMemberService(request.log).list({
            platformId: request.principal.platform.id,  
            projectId: request.principal.projectId,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_LIMIT_SIZE,
            projectRoleId: request.query.projectRoleId ?? undefined,
        })
    })



    app.post('/:id', UpdateProjectMemberRoleRequest, async (req) => {
        return projectMemberService(req.log).update({
            id: req.params.id,
            role: req.body.role,
            projectId: req.principal.projectId,
            platformId: req.principal.platform.id,
        })
    })


    app.delete('/:id', DeleteProjectMemberRequest, async (request, reply) => {
        await projectMemberService(request.log).delete(
            request.principal.projectId,
            request.params.id,
        )
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const GetCurrentProjectMemberRoleRequest = {
    config: {
        security: projectAccess([PrincipalType.USER, PrincipalType.SERVICE] as const, Permission.READ_PROJECT_MEMBER, {
            type: ProjectResourceType.QUERY
        }),
    },
    schema: {
        querystring: GetCurrentProjectMemberRoleRequestQuery,
    },
}

const UpdateProjectMemberRoleRequest = {
    config: {
        security: projectAccess([PrincipalType.USER, PrincipalType.SERVICE] as const, Permission.WRITE_PROJECT_MEMBER, {
            type: ProjectResourceType.BODY
        })
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateProjectMemberRoleRequestBody,
    },
    response: {
        [StatusCodes.OK]: ProjectMemberWithUser,
    },
}

const ListProjectMembersRequestQueryOptions = {
    config: {
        security: projectAccess([PrincipalType.USER, PrincipalType.SERVICE] as const, Permission.READ_PROJECT_MEMBER, {
            type: ProjectResourceType.QUERY
        })
    },
    schema: {
        tags: ['project-members'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListProjectMembersRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(ProjectMemberWithUser),
        },
    },
}

const DeleteProjectMemberRequest = {
    config: {
        security: projectAccess([PrincipalType.USER, PrincipalType.SERVICE] as const, Permission.WRITE_PROJECT_MEMBER, {
            type: ProjectResourceType.TABLE,
            tableName: ProjectMemberEntity,
        })
    },
    schema: {
        tags: ['project-members'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
