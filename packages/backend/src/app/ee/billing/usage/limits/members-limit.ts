import { ActivepiecesError, ApEdition, ErrorCode, ProjectId } from '@activepieces/shared'
import { plansService } from '../../plans/plan.service'
import { ProjectMemberEntity } from '../../../../ee/project-members/project-member.entity'
import { databaseConnection } from '../../../../database/database-connection'
import { getEdition } from '../../../../helper/secret-helper'

const projectMemberRepo =
    databaseConnection.getRepository(ProjectMemberEntity)

export const projectMembersLimit = {
    async limit({ projectId }: { projectId: ProjectId }): Promise<void> {
        const edition = getEdition()
        if (edition !== ApEdition.ENTERPRISE) {
            return
        }
        const projectPlan = await plansService.getOrCreateDefaultPlan({
            projectId,
        })
        const numberOfMembers = await projectMemberRepo.countBy({
            projectId,
        }) + 1

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