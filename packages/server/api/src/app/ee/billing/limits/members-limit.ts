import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ProjectId,
} from '@activepieces/shared'
import { getEdition } from '../../../helper/secret-helper'
import { plansService } from '../project-plan/project-plan.service'
import { ProjectMemberEntity } from '../../project-members/project-member.entity'
import { databaseConnection } from '../../../database/database-connection'

const projectMemberRepo = databaseConnection.getRepository(ProjectMemberEntity)

export const projectMembersLimit = {
    async limit({ projectId }: { projectId: ProjectId }): Promise<void> {
        const edition = getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }
        const projectPlan = await plansService.getOrCreateDefaultPlan({
            projectId,
        })
        const numberOfMembers =
      (await projectMemberRepo.countBy({
          projectId,
      })) + 1

        if (numberOfMembers > projectPlan.teamMembers) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: 'team-members',
                    quota: projectPlan.teamMembers,
                },
            })
        }
    },
}
