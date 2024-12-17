import { Static, Type } from '@sinclair/typebox'

export const CreateProjectReleaseRequestBody = Type.Object({
    fileId: Type.String(),
    importedBy: Type.String(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
})

export type CreateProjectReleaseRequestBody = Static<typeof CreateProjectReleaseRequestBody>