import {
    ListPlatformProjectMembersRequestQuery,
    ProjectMemberWithUser,
} from '@activepieces/ee-shared'
import {
    Permission,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { projectMemberService } from '../project-member.service'

const DEFAULT_LIMIT_SIZE = 10

export const platformProjectMemberController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.get('/users', ListPlatformProjectMembersRequestQueryOptions, async (request) => {
        return projectMemberService(request.log).list({
            platformId: request.principal.platform.id,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_LIMIT_SIZE,
            projectRoleId: request.query.projectRoleId ?? undefined,
        })
    })
}

const ListPlatformProjectMembersRequestQueryOptions = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_PROJECT_MEMBER,
    },
    schema: {
        tags: ['project-members'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListPlatformProjectMembersRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(ProjectMemberWithUser),
        },
    },
}