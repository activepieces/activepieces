import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { ProjectReleaseType } from './project-release.request'

export const ProjectRelease = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    importedBy: Type.Union([Type.String(), Type.Null()]),
    fileId: Type.String(),
    type: Type.Enum(ProjectReleaseType),
})

export type ProjectRelease = Static<typeof ProjectRelease>
