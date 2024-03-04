import {
    ListProjectMembersRequestQuery,
    AcceptProjectResponse,
    AddProjectMemberRequestBody,
    ProjectMember,
    ProjectMemberStatus,
} from '@activepieces/ee-shared'
import {
    ALL_PRINCIPAL_TYPES,
    ActivepiecesError,
    ErrorCode,
    Permission,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    assertNotNullOrUndefined,
    isNil,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { logger } from 'server-shared'
import { userService } from '../../user/user-service'
import { projectMemberService } from './project-member.service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { platformService } from '../../platform/platform.service'

const DEFAULT_LIMIT_SIZE = 10

export const projectMemberController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.get('/', ListProjectMembersRequestQueryOptions, async (request) => {
        return projectMemberService.list(
            request.principal.projectId,
            request.query.cursor ?? null,
            request.query.limit ?? DEFAULT_LIMIT_SIZE,
        )
    })

    app.post('/', AddProjectMemberRequest, async (request, reply) => {
        const { status } = request.body
        if (status === ProjectMemberStatus.ACTIVE) {
            await assertFeatureIsEnabled(app, request, reply)
        }
        const { projectMember } = await projectMemberService.upsertAndSend({
            ...request.body,
            projectId: request.principal.projectId,
        })

        await reply.status(StatusCodes.CREATED).send(projectMember)
    })

    app.post('/accept', AcceptProjectMemberRequest, async (request, reply) => {
        try {
            const projectMember = await projectMemberService.accept({
                invitationToken: request.body.token,
            })

            const user = await userService.getByPlatformAndEmail({
                email: projectMember.email,
                platformId: request.principal.platform.id ?? null,
            })

            return {
                registered: !isNil(user),
            }
        }
        catch (e) {
            logger.error(e)
            return reply.status(StatusCodes.UNAUTHORIZED).send()
        }
    })

    app.delete('/:id', DeleteProjectMemberRequest, async (request, reply) => {
        await projectMemberService.delete(
            request.principal.projectId,
            request.params.id,
        )
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function assertFeatureIsEnabled(
    app: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    await platformMustBeOwnedByCurrentUser.call(app, request, reply)
    const platformId = request.principal.platform.id
    assertNotNullOrUndefined(platformId, 'platformId')
    const platform = await platformService.getOneOrThrow(platformId)
    // TODO CHECK WITH BUSINESS LOGIC
    if (!platform.embeddingEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
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
    },
}

const AddProjectMemberRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_PROJECT_MEMBER,
    },
    schema: {
        tags: ['project-members'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: AddProjectMemberRequestBody,
        response: {
            [StatusCodes.CREATED]: ProjectMember,
        },
    },
}

const AcceptProjectMemberRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: Type.Object({
            token: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: AcceptProjectResponse,
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
