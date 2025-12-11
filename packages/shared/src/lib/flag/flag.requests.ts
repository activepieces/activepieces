import { Static, Type } from '@sinclair/typebox'
import { TemplateCategory } from '../template/template'

export const UpdateTemplatesCategoriesFlagRequestBody = Type.Object({
    value: Type.Array(Type.Enum(TemplateCategory)),
})
export type UpdateTemplatesCategoriesFlagRequestBody = Static<typeof UpdateTemplatesCategoriesFlagRequestBody>