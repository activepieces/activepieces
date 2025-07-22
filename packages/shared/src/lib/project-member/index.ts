import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { ProjectRole } from '../project-role/project-role'

export const ProjectMember = Type.Object({
    ...BaseModelSchema,
    userId: ApId,
    platformId: ApId,
    projectId: ApId,
    projectRoleId: ApId,
})

export type ProjectMember = Static<typeof ProjectMember>

export const ListProjectMemberQueryParams = Type.Object({
    projectId: Type.String(),
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
})

export type ListProjectMemberQueryParams = Static<typeof ListProjectMemberQueryParams>

export const ListProjectMemberRoleBody = Type.Object({
    name: Type.String(),
    value: Type.Enum(ProjectRole),
})

export type ListProjectMemberRoleBody = Static<typeof ListProjectMemberRoleBody>
