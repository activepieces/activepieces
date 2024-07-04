import {
    ActivepiecesError,
    ErrorCode,
    ProjectId,
    ProjectMemberRole,
} from '@activepieces/shared'
import { flagService } from '../../flags/flag.service'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../project-members/project-member.service'
import { projectLimitsService } from './project-plan.service'

export const projectMembersLimit = {
    async limit({ projectId, platformId, role }: { projectId: ProjectId, platformId: string, role: ProjectMemberRole }): Promise<void> {
        const shouldLimit = await shouldLimitMembers({ projectId, platformId, role })

        if (shouldLimit) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: 'team-members',
                },
            })
        }
    },
}

const UNLIMITED_TEAM_MEMBERS = 100

async function shouldLimitMembers({ projectId, platformId, role }: { projectId: ProjectId, platformId: string, role: ProjectMemberRole }): Promise<boolean> {
    if (!flagService.isCloudPlatform(platformId)) {
        return false
    }
    const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
    if (!projectPlan) {
        return false
    }
    if (projectPlan.teamMembers === UNLIMITED_TEAM_MEMBERS) {
        return role !== ProjectMemberRole.ADMIN
    }
    const numberOfMembers = await projectMemberService.countTeamMembers(projectId)
    const numberOfInvitations = await userInvitationsService.countByProjectId(projectId)
    return numberOfMembers + numberOfInvitations > projectPlan.teamMembers
}