import { Static, Type } from '@sinclair/typebox'

export const UpdateTemplatesCategoriesFlagRequestBody = Type.Object({
    value: Type.Array(Type.String()),
})
export type UpdateTemplatesCategoriesFlagRequestBody = Static<typeof UpdateTemplatesCategoriesFlagRequestBody>