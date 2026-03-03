import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../../core/common'
import { UserWithMetaInformation } from '../../core/user'
import { ProjectReleaseType } from './project-release.request'

export const ProjectRelease = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    name: Type.String(),
    description: Nullable(Type.String()),
    importedBy: Nullable(Type.String()),
    fileId: Type.String(),
    type: Type.Enum(ProjectReleaseType),
    importedByUser: Type.Optional(UserWithMetaInformation),
})

export type ProjectRelease = Static<typeof ProjectRelease>
