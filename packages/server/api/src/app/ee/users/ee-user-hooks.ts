import { isNil } from '@activepieces/core-utils'
import { DefaultProjectRole, PlatformRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { UserHooks } from '../../user/user-hooks'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../projects/project-members/project-member.service'

export const userEnterpriseHooks = (log: FastifyBaseLogger): UserHooks => ({
    async postCreate({ user, email, platformId, defaultProjectIds, platformRoleAssigned, entityManager }) {
        if (defaultProjectIds.length === 0 || user.platformRole !== PlatformRole.MEMBER) {
            return
        }
        if (!platformRoleAssigned) {
            const invitedRole = await userInvitationsService(log).getAcceptedAdminOrOperatorInviteRole({ email, platformId, entityManager })
            if (!isNil(invitedRole)) {
                return
            }
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
