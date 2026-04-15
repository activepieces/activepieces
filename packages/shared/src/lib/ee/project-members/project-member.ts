import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { UserWithMetaInformation } from '../../core/user/user'
import { ProjectMetaData } from '../../management/project/project'
import { ProjectRole } from '../../management/project-role/project-role'

export type ProjectMemberId = string

export const ProjectMember = z.object({
    ...BaseModelSchema,
    platformId: ApId,
    userId: ApId,
    projectId: z.string(),
    projectRoleId: ApId,
}).describe('Project member is which user is assigned to a project.')

export type ProjectMember = z.infer<typeof ProjectMember>

export const ProjectMemberWithUser = ProjectMember.extend({
    user: UserWithMetaInformation,
    projectRole: ProjectRole,
    project: ProjectMetaData,
})

export type ProjectMemberWithUser = z.infer<typeof ProjectMemberWithUser>
