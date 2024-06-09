import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { assertRoleHasPermission } from '../ee/authentication/rbac/rbac-middleware'
import { userInvitationsService } from './user-invitation.service'
import { AcceptUserInvitationRequest, InvitationType, isNil, Permission, PrincipalType, SendUserInvitationRequest } from '@activepieces/shared'


export const invitationModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(invitationController, { prefix: '/v1/user-invitations' })
}

const invitationController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.post('/', CreateUserInvitationRequestParams, async (request, reply) => {
        await assertPermission(app, request, reply, request.body.type)
        const { email, platformId, projectId, platformRole, projectRole, type } = request.body
        const invitation = await userInvitationsService.create({
            email,
            type,
            platformId,
            projectId: isNil(projectId) ? null : projectId,
            projectRole: isNil(projectRole) ? null : projectRole,
            platformRole,
        })
        await reply.status(StatusCodes.CREATED).send(invitation)
    })

    app.post('/accept', AcceptUserInvitationRequestParams, async (request, reply) => {
        await userInvitationsService.accept(request.body)
        await reply.status(StatusCodes.NO_CONTENT).send()
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


const AcceptUserInvitationRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: AcceptUserInvitationRequest,
    },
}

const DeleteInvitationRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const CreateUserInvitationRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: SendUserInvitationRequest,
    },
}
