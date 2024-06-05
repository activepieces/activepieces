import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userInvitationsService } from './invitation.service'
import {
    DeleteUserInvitationRequest,
    SendUserInvitationRequest,
} from '@activepieces/ee-shared'
import { isNil, PrincipalType } from '@activepieces/shared'


// TODO add permisions
export const invitationController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.post('/', CreateProjectMemberRequest, async (request, reply) => {
        const { email, platformId, projectId, platformRole, projectRole } = request.body
        const invitation = await userInvitationsService.create({
            email,
            platformId,
            projectId: isNil(projectId) ? null : projectId,
            platformRole,
            projectRole: isNil(projectRole) ? null : projectRole,
        })
        await reply.status(StatusCodes.CREATED).send(invitation)
    })

    app.delete('/:id', DeleteProjectMemberRequestParams, async (request, reply) => {
        await userInvitationsService.delete({
            email: request.body.email,
            platformId: request.body.platformId,
            projectId: isNil(request.body.projectId) ? null : request.body.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const DeleteProjectMemberRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: DeleteUserInvitationRequest,
    },
}

const CreateProjectMemberRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: SendUserInvitationRequest,
    },
}
