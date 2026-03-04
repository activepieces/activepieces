import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { UserWithMetaInformation } from '../../core/user/user'
import { ProjectMetaData } from '../../management/project/project'
import { ProjectRole } from '../../management/project-role/project-role'

export type ProjectMemberId = string

export const ProjectMember = Type.Object({
    ...BaseModelSchema,
    platformId: ApId,
    userId: ApId,
    projectId: Type.String(),
    projectRoleId: ApId,
}, {
    description: 'Project member is which user is assigned to a project.',
})

export type ProjectMember = Static<typeof ProjectMember>

export const ProjectMemberWithUser = Type.Composite([ProjectMember, Type.Object({
    user: UserWithMetaInformation,
    projectRole: ProjectRole,
    project: ProjectMetaData,
})])

export type ProjectMemberWithUser = Static<typeof ProjectMemberWithUser>