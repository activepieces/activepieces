import {
    AcceptUserInvitationRequest,
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    EndpointScope,
    ErrorCode,
    InvitationType,
    isNil,
    ListUserInvitationsRequest,
    Permission,
    PrincipalType,
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
import { assertRoleHasPermission } from '../ee/authentication/rbac/rbac-middleware'
import { projectMembersLimit } from '../ee/project-plan/members-limit'
import { projectService } from '../project/project-service'
import { userInvitationsService } from './user-invitation.service'


export const invitationModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(invitationController, { prefix: '/v1/user-invitations' })
}

const invitationController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.post('/', CreateUserInvitationRequestParams, async (request, reply) => {
        const projectId = request.body.projectId ?? request.principal.projectId
        await assertPrincipalHasPermission(app, request, reply, projectId ?? undefined, request.body.type, Permission.WRITE_INVITATION)
        const { email, platformRole, projectRole, type, expireyInSeconds } = request.body
        if (type === InvitationType.PROJECT) {
            await projectMembersLimit.limit({
                projectId,
                platformId: request.principal.platform.id,
                role: projectRole!,
            })
        }
        const platformId = request.principal.platform.id
        const invitation = await userInvitationsService.create({
            email,
            type,
            platformId,
            platformRole: type === InvitationType.PROJECT ? null : platformRole ?? null,
            projectId: type === InvitationType.PLATFORM ? null : projectId ?? null,
            projectRole: type === InvitationType.PLATFORM ? null : projectRole ?? null,
            invitationExpirySeconds: expireyInSeconds ?? dayjs.duration(1, 'day').asSeconds(),
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
        const result = await userInvitationsService.accept(request.body)
        await reply.status(StatusCodes.OK).send(result)
    })

    app.delete('/:id', DeleteInvitationRequestParams, async (request, reply) => {
        const invitation = await userInvitationsService.getOneOrThrow({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        await assertPrincipalHasPermission(app, request, reply, invitation.projectId ?? undefined, invitation.type, Permission.WRITE_INVITATION)
        await userInvitationsService.delete({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const getProjectIdAndAssertPermission = async (app: FastifyInstance, request: FastifyRequest, reply: FastifyReply, requestQuery: ListUserInvitationsRequest): Promise<string | null> => {
    const isServicePrincipal = request.principal.type === PrincipalType.SERVICE
    const projectId = isServicePrincipal ? requestQuery.projectId : request.principal.projectId
    if (isServicePrincipal && projectId) {
        await assertPrincipalHasPermission(app, request, reply, projectId, requestQuery.type, Permission.READ_INVITATION)
    }
    return projectId ?? null
}

async function assertPrincipalHasPermission(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply, projectId: string | undefined, invitationType: InvitationType, permission: Permission): Promise<void> {
    switch (invitationType) {
        case InvitationType.PLATFORM:
            await platformMustBeOwnedByCurrentUser.call(fastify, request, reply)
            break
        case InvitationType.PROJECT: {
            if (isNil(projectId)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'projectId is required',
                    },
                })
            }
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
            break
        }
    }
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
        body: AcceptUserInvitationRequest,
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

const CreateUserInvitationRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        body: SendUserInvitationRequest,
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.CREATED]: UserInvitationWithLink,
        },
    },
}
