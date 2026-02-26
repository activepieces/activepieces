import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { ProjectMetaData } from '../project/project'
import { ProjectRole } from '../project-role/project-role'
import { UserWithMetaInformation } from '../user/user'
import { Static, Type } from '@sinclair/typebox'

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