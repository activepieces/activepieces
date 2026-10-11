import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformService } from '../../platform/platform.service'
import { projectRepo } from '../../project/project-repo'
import { UserProjectHooks } from '../../user/user-project-hooks'
import { projectMemberService } from '../projects/project-members/project-member.service'

export const userProjectEnterpriseHooks = (log: FastifyBaseLogger): UserProjectHooks => ({
    async addToProject({ userId, platformId, projectId, projectRoleName, entityManager }) {
        const platform = await platformService(log).getOneWithPlanOrThrow(platformId)
        if (!platform.plan.projectRolesEnabled) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Project roles are not enabled for this platform',
                },
            })
        }
        const project = await projectRepo(entityManager).findOneBy({ id: projectId, platformId, type: ProjectType.TEAM })
        if (!project) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'The project must be a team project of this platform',
                },
            })
        }
        await projectMemberService(log).upsert({ userId, projectId, projectRoleName, entityManager })
    },
})
