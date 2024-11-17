import {
    ActivepiecesError,
    ApId,
    ErrorCode,
    ProjectId,
    ProjectMemberRole,
    RoleType,
} from '@activepieces/shared'
import { flagService } from '../../flags/flag.service'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../project-members/project-member.service'
import { projectLimitsService } from './project-plan.service'
import { rbacService } from '../rbac/rbac.service'

export const projectMembersLimit = {
    async limit({ projectId, platformId, roleId }: { projectId: ProjectId, platformId: string, roleId: ApId }): Promise<void> {
        const shouldLimit = await shouldLimitMembers({ projectId, platformId, roleId })

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

async function shouldLimitMembers({ projectId, platformId, roleId }: { projectId: ProjectId, platformId: string, roleId: ApId }): Promise<boolean> {
    if (!flagService.isCloudPlatform(platformId)) {
        return false
    }
    const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
    if (!projectPlan) {
        return false
    }
    if (projectPlan.teamMembers === UNLIMITED_TEAM_MEMBERS) {
        const role = await rbacService.get(roleId, RoleType.DEFAULT)
        if (!role) {
            return false
        }
        return role.type !== RoleType.DEFAULT || (role.name !== ProjectMemberRole.ADMIN)
    }
    const numberOfMembers = await projectMemberService.countTeamMembers(projectId)
    const numberOfInvitations = await userInvitationsService.countByProjectId(projectId)
    return numberOfMembers + numberOfInvitations > projectPlan.teamMembers
}