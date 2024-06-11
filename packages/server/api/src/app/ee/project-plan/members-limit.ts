import { flagService } from '../../flags/flag.service'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../project-members/project-member.service'
import { projectLimitsService } from './project-plan.service'
import {
    ActivepiecesError,
    ErrorCode,
    ProjectId,
} from '@activepieces/shared'

export const projectMembersLimit = {
    async limit({ projectId, platformId }: { projectId: ProjectId, platformId: string }): Promise<void> {
        if (!flagService.isCloudPlatform(platformId)) {
            return
        }
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
        if (!projectPlan) {
            return
        }
        const numberOfMembers = await projectMemberService.countTeamMembers(projectId)
        const numberOfInvitations = await userInvitationsService.countByProjectId(projectId)

        if (numberOfMembers + numberOfInvitations > projectPlan.teamMembers) {
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
