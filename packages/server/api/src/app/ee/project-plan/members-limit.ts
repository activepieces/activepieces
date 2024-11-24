import {
    ActivepiecesError,
    ApId,
    ErrorCode,
    Permission,
    ProjectId,
    RoleType,
} from '@activepieces/shared'
import { flagService } from '../../flags/flag.service'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../project-members/project-member.service'
import { projectRoleService } from '../project-role/project-role.service'
import { projectLimitsService } from './project-plan.service'

export const projectMembersLimit = {
    async limit({ projectId, platformId, projectRoleId }: { projectId: ProjectId, platformId: string, projectRoleId: ApId }): Promise<void> {
        const shouldLimit = await shouldLimitMembers({ projectId, platformId, projectRoleId })

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

async function shouldLimitMembers({ projectId, platformId, projectRoleId }: { projectId: ProjectId, platformId: string, projectRoleId: ApId }): Promise<boolean> {
    if (!flagService.isCloudPlatform(platformId)) {
        return false
    }
    const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
    if (!projectPlan) {
        return false
    }
    if (projectPlan.teamMembers === UNLIMITED_TEAM_MEMBERS) {
        const projectRole = await projectRoleService.getOneOrThrow({
            id: projectRoleId,
            platformId,
        })
        if (!projectRole) {
            return false
        }
        return projectRole.type !== RoleType.DEFAULT || (projectRole.permissions.includes(Permission.WRITE_PROJECT) === false)
    }
    const numberOfMembers = await projectMemberService.countTeamMembers(projectId)
    const numberOfInvitations = await userInvitationsService.countByProjectId(projectId)
    return numberOfMembers + numberOfInvitations > projectPlan.teamMembers
}