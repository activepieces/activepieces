import {
    ActivepiecesError,
    ErrorCode,
    Permission,
    ProjectId,
    ProjectRole,
    RoleType,
} from '@activepieces/shared'
import { flagService } from '../../flags/flag.service'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../project-members/project-member.service'
import { projectLimitsService } from './project-plan.service'

export const projectMembersLimit = {
    async limit({ projectId, platformId, projectRole }: { projectId: ProjectId, platformId: string, projectRole: ProjectRole }): Promise<void> {
        const shouldLimit = await shouldLimitMembers({ projectId, platformId, projectRole })

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

async function shouldLimitMembers({ projectId, platformId, projectRole }: { projectId: ProjectId, platformId: string, projectRole: ProjectRole }): Promise<boolean> {
    if (!flagService.isCloudPlatform(platformId)) {
        return false
    }
    const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
    if (!projectPlan) {
        return false
    }
    if (projectPlan.teamMembers === UNLIMITED_TEAM_MEMBERS) {
        if (!projectRole) {
            return false
        }
        return projectRole.type !== RoleType.DEFAULT || (projectRole.permissions.includes(Permission.WRITE_PROJECT) === false)
    }
    const numberOfMembers = await projectMemberService.countTeamMembers(projectId)
    const numberOfInvitations = await userInvitationsService.countByProjectId(projectId)
    return numberOfMembers + numberOfInvitations > projectPlan.teamMembers
}