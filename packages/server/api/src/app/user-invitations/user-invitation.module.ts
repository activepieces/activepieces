import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    assertNotNullOrUndefined,
    EndpointScope,
    ErrorCode,
    InvitationStatus,
    InvitationType,
    isNil,
    ListUserInvitationsRequest,
    Permission,
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
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { assertRoleHasPermission } from '../ee/authentication/project-role/rbac-middleware'
import { projectMembersLimit } from '../ee/project-plan/members-limit'
import { projectRoleService } from '../ee/project-role/project-role.service'
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
                await assertPrincipalHasPermissionToProject(app, request, reply, request.body.projectId, Permission.WRITE_INVITATION)
                break
            case InvitationType.PLATFORM:
                await platformMustBeOwnedByCurrentUser.call(app, request, reply)
                break
        }
        const status = request.principal.type === PrincipalType.SERVICE ? InvitationStatus.ACCEPTED : InvitationStatus.PENDING
        const projectRole = await getProjectRoleAndAssertIfFound(request.principal.platform.id, request.body)
        const platformId = request.principal.platform.id
        const invitation = await userInvitationsService.create({
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
        const projectId = await getProjectIdAndAssertPermission(app, request, reply, request.query)
        const invitations = await userInvitationsService.list({
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
        const invitation = await userInvitationsService.getOneByInvitationTokenOrThrow(request.body.invitationToken)
        await userInvitationsService.accept({
            invitationId: invitation.id,
            platformId: invitation.platformId,
        })
        await reply.status(StatusCodes.OK).send(invitation)
    })

    app.delete('/:id', DeleteInvitationRequestParams, async (request, reply) => {
        const invitation = await userInvitationsService.getOneOrThrow({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        switch (invitation.type) {
            case InvitationType.PROJECT: {
                assertNotNullOrUndefined(invitation.projectId, 'projectId')
                await assertPrincipalHasPermissionToProject(app, request, reply, invitation.projectId, Permission.WRITE_INVITATION)
                break
            }
            case InvitationType.PLATFORM:
                await platformMustBeOwnedByCurrentUser.call(app, request, reply)
                break
        }
        await userInvitationsService.delete({
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
    
    await projectMembersLimit.limit({
        projectId: request.projectId,
        platformId,
        projectRoleName,
    })

    const projectRole = await projectRoleService.getOneOrThrow({
        name: projectRoleName,
        platformId,
    })
    return projectRole
}

const getProjectIdAndAssertPermission = async (app: FastifyInstance, request: FastifyRequest, reply: FastifyReply, requestQuery: ListUserInvitationsRequest): Promise<string | null> => {
    if (request.principal.type === PrincipalType.SERVICE) {
        if (isNil(requestQuery.projectId)) {
            return null
        }
        await assertPrincipalHasPermissionToProject(app, request, reply, requestQuery.projectId, Permission.READ_INVITATION)
        return requestQuery.projectId
    }
    return request.principal.projectId
}


async function assertPrincipalHasPermissionToProject(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply, projectId: string, permission: Permission): Promise<void> {
    const project = await projectService.getOneOrThrow(projectId)
    if (isNil(project) || project.platformId !== request.principal.platform.id) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'user does not have access to the project',
            },
        })
    }
    await platformMustHaveFeatureEnabled((platform) => platform.projectRolesEnabled).call(fastify, request, reply)
    await assertRoleHasPermission(request.principal, permission)
}


const ListUserInvitationsRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_INVITATION,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListUserInvitationsRequest,
        responnse: {
            [StatusCodes.OK]: SeekPage(UserInvitation),
        },
    },
}

const AcceptUserInvitationRequestParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: Type.Object({
            invitationToken: Type.String(),
        }),
    },
}

const DeleteInvitationRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
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
