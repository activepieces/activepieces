import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const ProjectRelease = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    importedBy: Type.Union([Type.String(), Type.Null()]),
    fileId: Type.String(),
})

export type ProjectRelease = Static<typeof ProjectRelease>
