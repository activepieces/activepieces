import { Static, Type } from '@sinclair/typebox'
import { TemplateCategory } from '../template/template'

export const UpdateFlagRequestBody = Type.Object({
    value: Type.Array(Type.Enum(TemplateCategory)),
})
export type UpdateFlagRequestBody = Static<typeof UpdateFlagRequestBody>