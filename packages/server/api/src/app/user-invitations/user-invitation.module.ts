import { AcceptUserInvitationRequest, ALL_PRINCIPAL_TYPES, InvitationType, ListUserInvitationsRequest, Permission, PrincipalType, SeekPage, SendUserInvitationRequest, SERVICE_KEY_SECURITY_OPENAPI, UserInvitation, UserInvitationWithLink } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { assertRoleHasPermission } from '../ee/authentication/rbac/rbac-middleware'
import { projectMembersLimit } from '../ee/project-plan/members-limit'
import { userInvitationsService } from './user-invitation.service'


export const invitationModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(invitationController, { prefix: '/v1/user-invitations' })
}

const invitationController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.post('/', CreateUserInvitationRequestParams, async (request, reply) => {
        await assertPermission(app, request, reply, request.body.type)
        const { email, platformRole, projectRole, type } = request.body
        if (type === InvitationType.PROJECT) {
            await projectMembersLimit.limit({
                projectId: request.principal.projectId,
                platformId: request.principal.platform.id,
                role: projectRole!,
            })
        }
        const platformId = request.principal.platform.id
        const projectId = request.principal.projectId
        const invitation = await userInvitationsService.create({
            email,
            type,
            platformId,
            platformRole: type === InvitationType.PROJECT  ? null : platformRole ?? null,
            projectId: type === InvitationType.PLATFORM ? null : projectId ?? null,
            projectRole: type === InvitationType.PLATFORM  ? null : projectRole ?? null,
        })
        await reply.status(StatusCodes.CREATED).send(invitation)
    })

    app.get('/', ListUserInvitationsRequestParams, async (request, reply) => {
        const invitations = await userInvitationsService.list({
            platformId: request.principal.platform.id,
            projectId: request.query.type === InvitationType.PROJECT ? request.principal.projectId : null,
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
        await assertPermission(app, request, reply, invitation.type)
        await userInvitationsService.delete({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function assertPermission(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply, invitationType: InvitationType): Promise<void> {
    switch (invitationType) {
        case InvitationType.PLATFORM:
            await platformMustBeOwnedByCurrentUser.call(fastify, request, reply)
            break
        case InvitationType.PROJECT:
            await platformMustHaveFeatureEnabled((platform) => platform.projectRolesEnabled).call(fastify, request, reply)
            await assertRoleHasPermission(request.principal, Permission.WRITE_INVITATION)
            break
    }
}


const ListUserInvitationsRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_INVITATION,
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
    },
    schema: {
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}

const CreateUserInvitationRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
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
