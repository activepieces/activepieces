import { InviteRewardSummary, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { userInvitationHooks } from '../../user-invitations/user-invitation-hooks'
import { inviteRewardService } from './invite-reward.service'

export const inviteRewardModule: FastifyPluginAsyncZod = async (app) => {
    userInvitationHooks.set((log) => ({
        onInvitedUserJoined: (params) => inviteRewardService(log).grantOnJoin(params),
    }))
    await app.register(inviteRewardController, { prefix: '/v1/invite-rewards' })
}

const inviteRewardController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', SummaryRequest, async (request) => {
        return inviteRewardService(request.log).getSummary({ platformId: request.principal.platform.id })
    })
}

const SummaryRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: InviteRewardSummary,
        },
    },
}
