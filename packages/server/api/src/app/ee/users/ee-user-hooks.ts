import { DefaultProjectRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { UserHooks } from '../../user/user-hooks'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../projects/project-members/project-member.service'

export const userEnterpriseHooks = (log: FastifyBaseLogger): UserHooks => ({
    async postCreate({ user, email, platformId, defaultProjectIds, entityManager }) {
        if (defaultProjectIds.length === 0) {
            return
        }
        const invitedAsAdminOrOperator = await userInvitationsService(log).hasAcceptedAdminOrOperatorInvite({ email, platformId, entityManager })
        if (invitedAsAdminOrOperator) {
            return
        }
        await projectMemberService(log).addToTeamProjects({
            userId: user.id,
            platformId,
            projectIds: defaultProjectIds,
            projectRoleName: DefaultProjectRole.EDITOR,
            entityManager,
        })
    },
})
