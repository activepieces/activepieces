import {
    ActivepiecesError,
    ErrorCode,
    Permission,
    ProjectId,
    RoleType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flagService } from '../../flags/flag.service'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../project-members/project-member.service'
import { projectRoleService } from '../project-role/project-role.service'
import { projectLimitsService } from './project-plan.service'

export const projectMembersLimit = (log: FastifyBaseLogger) => ({
    async limit({ projectId, platformId, projectRoleName }: { projectId: ProjectId, platformId: string, projectRoleName: string }): Promise<void> {
        const shouldLimit = await shouldLimitMembers({ projectId, platformId, projectRoleName, log })

        if (shouldLimit) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: 'team-members',
                },
            })
        }
    },
})

const UNLIMITED_TEAM_MEMBERS = 100

async function shouldLimitMembers({ projectId, platformId, projectRoleName, log }: { projectId: ProjectId, platformId: string, projectRoleName: string, log: FastifyBaseLogger }): Promise<boolean> {
    if (!flagService.isCloudPlatform(platformId)) {
        return false
    }
    const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
    if (!projectPlan) {
        return false
    }
    if (projectPlan.teamMembers === UNLIMITED_TEAM_MEMBERS) {
        const projectRole = await projectRoleService.getOneOrThrow({
            name: projectRoleName,
            platformId,
        })
        return projectRole.type !== RoleType.DEFAULT || (projectRole.permissions?.includes(Permission.WRITE_PROJECT) === false)
    }
    const numberOfMembers = await projectMemberService(log).countTeamMembers(projectId)
    const numberOfInvitations = await userInvitationsService(log).countByProjectId(projectId)
    return numberOfMembers + numberOfInvitations > projectPlan.teamMembers
}