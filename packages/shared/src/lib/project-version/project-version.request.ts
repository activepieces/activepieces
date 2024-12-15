import { Static, Type } from '@sinclair/typebox'

export const CreateProjectVersionRequestBody = Type.Object({
    fileId: Type.String(),
    importedBy: Type.String(),
})

export type CreateProjectVersionRequestBody = Static<typeof CreateProjectVersionRequestBody>