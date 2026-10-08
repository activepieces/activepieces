import { ActivepiecesError, apId, ErrorCode } from '@activepieces/core-utils'
import { ProjectType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { platformService } from '../../platform/platform.service'
import { projectRepo } from '../../project/project-repo'
import { UserProjectHooks } from '../../user/user-project-hooks'
import { ProjectMemberEntity } from '../projects/project-members/project-member.entity'
import { projectRoleService } from '../projects/project-role/project-role.service'

const projectMemberRepo = repoFactory(ProjectMemberEntity)

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
        const projectRole = await projectRoleService.getOneOrThrow({ name: projectRoleName, platformId })
        await projectMemberRepo(entityManager)
            .createQueryBuilder()
            .insert()
            .values({
                id: apId(),
                updated: dayjs().toISOString(),
                userId,
                platformId,
                projectId,
                projectRoleId: projectRole.id,
            })
            .orUpdate(['projectRoleId', 'updated'], ['projectId', 'userId', 'platformId'])
            .execute()
    },
})
