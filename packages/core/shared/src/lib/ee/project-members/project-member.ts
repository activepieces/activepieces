import { ApId, BaseModelSchema, ProjectRole } from '@activepieces/core-utils'
import { z } from 'zod'
import { UserWithMetaInformation } from '../../core/user/user'
import { ProjectMetaData } from '../../management/project/project'

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
