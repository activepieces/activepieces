import { DefaultProjectRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { UserHooks } from '../../user/user-hooks'
import { projectMemberService } from '../projects/project-members/project-member.service'

export const userEnterpriseHooks = (log: FastifyBaseLogger): UserHooks => ({
    async postCreate({ user, platformId, defaultProjectIds, entityManager }) {
        if (defaultProjectIds.length === 0) {
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
