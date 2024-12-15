import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const ProjectVersion = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    importedBy: Type.Union([Type.String(), Type.Null()]),
    fileId: Type.String(),
})

export type ProjectVersion = Static<typeof ProjectVersion>
