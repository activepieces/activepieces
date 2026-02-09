import { securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
    InvitationStatus,
    InvitationType,
    isNil,
    ListUserInvitationsRequest,
    Permission,
    Principal,
    PrincipalType,
    ProjectRole,
    SeekPage,
    SendUserInvitationRequest,
    SERVICE_KEY_SECURITY_OPENAPI,
    UserInvitation,
    UserInvitationWithLink,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled, projectMustBeTeamType } from '../ee/authentication/ee-authorization'
import { assertRoleHasPermission } from '../ee/authentication/project-role/rbac-middleware'
import { projectRoleService } from '../ee/projects/project-role/project-role.service'
import { projectService } from '../project/project-service'
import { userInvitationsService } from './user-invitation.service'

export const invitationModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(invitationController, { prefix: '/v1/user-invitations' })
}

const invitationController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', UpsertUserInvitationRequestParams, async (request, reply) => {
        const { email, type } = request.body
        switch (type) {
            case InvitationType.PROJECT:
                await projectMustBeTeamType.call(app, request, reply)
                await assertPrincipalHasPermissionToProject(app, request, reply, request.principal, request.body.projectId, Permission.WRITE_INVITATION)
                break
            case InvitationType.PLATFORM:
                await platformMustBeOwnedByCurrentUser.call(app, request, reply)
                break
        }
        const status = request.principal.type === PrincipalType.SERVICE ? InvitationStatus.ACCEPTED : InvitationStatus.PENDING
        const projectRole = await getProjectRoleAndAssertIfFound(request.principal.platform.id, request.body)
        const platformId = request.principal.platform.id

        const invitation = await userInvitationsService(request.log).create({
            email,
            type,
            platformId,
            platformRole: type === InvitationType.PROJECT ? null : request.body.platformRole,
            projectId: type === InvitationType.PLATFORM ? null : request.body.projectId,
            projectRoleId: type === InvitationType.PLATFORM ? null : projectRole?.id ?? null,
            invitationExpirySeconds: dayjs.duration(1, 'day').asSeconds(),
            status,
        })
        await reply.status(StatusCodes.CREATED).send(invitation)
    })

    app.get('/', ListUserInvitationsRequestParams, async (request, reply) => {
        if (!isNil(request.query.projectId) && request.query.type === InvitationType.PROJECT) {
            await projectMustBeTeamType.call(app, request, reply)
        }
        const projectId = await getProjectIdAndAssertPermission(app, request, reply, request.principal, request.query)
        const invitations = await userInvitationsService(request.log).list({
            platformId: request.principal.platform.id,
            projectId: request.query.type === InvitationType.PROJECT ? projectId : null,
            type: request.query.type,
            status: request.query.status,
            cursor: request.query.cursor ?? null,
            limit: request.query.limit ?? 10,
        })
        await reply.status(StatusCodes.OK).send(invitations)
    })

    app.post('/accept', AcceptUserInvitationRequestParams, async (request, reply) => {
        const invitation = await userInvitationsService(request.log).getOneByInvitationTokenOrThrow(request.body.invitationToken)
        await userInvitationsService(request.log).accept({
            invitationId: invitation.id,
            platformId: invitation.platformId,
        })
        await reply.status(StatusCodes.OK).send(invitation)
    })

    app.delete('/:id', DeleteInvitationRequestParams, async (request, reply) => {
        const invitation = await userInvitationsService(request.log).getOneOrThrow({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        switch (invitation.type) {
            case InvitationType.PROJECT: {
                assertNotNullOrUndefined(invitation.projectId, 'projectId')
                await projectMustBeTeamType.call(app, request, reply)
                await assertPrincipalHasPermissionToProject(app, request, reply, request.principal, invitation.projectId, Permission.WRITE_INVITATION)
                break
            }
            case InvitationType.PLATFORM:
                await platformMustBeOwnedByCurrentUser.call(app, request, reply)
                break
        }
        await userInvitationsService(request.log).delete({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}


const getProjectRoleAndAssertIfFound = async (platformId: string, request: SendUserInvitationRequest): Promise<ProjectRole | null> => {
    const { type } = request
    if (type === InvitationType.PLATFORM) {
        return null
    }
    const projectRoleName = request.projectRole

    const projectRole = await projectRoleService.getOneOrThrow({
        name: projectRoleName,
        platformId,
    })
    return projectRole
}
async function getProjectIdAndAssertPermission<R extends Principal>(
    app: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply,
    principal: R,
    requestQuery: ListUserInvitationsRequest,
): Promise<string | null> {
    if (principal.type === PrincipalType.SERVICE) {
        if (isNil(requestQuery.projectId)) {
            return null
        }
        await assertPrincipalHasPermissionToProject(app, request, reply, principal, requestQuery.projectId, Permission.READ_INVITATION)
        return requestQuery.projectId
    }
    return requestQuery.projectId ?? null
}


async function assertPrincipalHasPermissionToProject<R extends Principal & { platform: { id: string } }>(
    fastify: FastifyInstance,
    request: FastifyRequest, reply: FastifyReply, principal: R,
    projectId: string, permission: Permission): Promise<void> {
    const project = await projectService.getOneOrThrow(projectId)
    if (isNil(project) || project.platformId !== principal.platform.id) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'user does not have access to the project',
            },
        })
    }
    await platformMustHaveFeatureEnabled((platform) => platform.plan.projectRolesEnabled).call(fastify, request, reply)
    await assertRoleHasPermission(request.principal, projectId, permission, request.log)
}


const ListUserInvitationsRequestParams = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListUserInvitationsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(UserInvitation),
        },
    },
}

const AcceptUserInvitationRequestParams = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: Type.Object({
            invitationToken: Type.String(),
        }),
    },
}

const DeleteInvitationRequestParams = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}

const UpsertUserInvitationRequestParams = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        body: SendUserInvitationRequest,
        description: 'Send a user invitation to a user. If the user already has an invitation, the invitation will be updated.',
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.CREATED]: UserInvitationWithLink,
        },
    },
}
