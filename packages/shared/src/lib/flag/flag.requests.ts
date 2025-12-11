import { Static, Type } from '@sinclair/typebox'
import { TemplateCategory } from '../template/template'
import { ApFlagId } from './flag'

export const UpdateFlagRequestParams = Type.Object({
    id: Type.Union([
        Type.Literal(ApFlagId.PUBLIC_URL),
        Type.Literal(ApFlagId.TELEMETRY_ENABLED),
        Type.Literal(ApFlagId.USER_CREATED),
        Type.Literal(ApFlagId.WEBHOOK_URL_PREFIX),
        Type.Literal(ApFlagId.TEMPLATES_CATEGORIES),
    ]),
})
export type UpdateFlagRequestParams = Static<typeof UpdateFlagRequestParams>

export const UpdateFlagRequestBody = Type.Object({
    value: Type.Union([
        Type.String({ minLength: 1 }),
        Type.Boolean(),
        Type.Array(Type.Enum(TemplateCategory)),
    ]),
})
export type UpdateFlagRequestBody = Static<typeof UpdateFlagRequestBody>

export type UpdateableFlag = 
    | { id: ApFlagId.PUBLIC_URL, value: string }
    | { id: ApFlagId.TELEMETRY_ENABLED, value: boolean }
    | { id: ApFlagId.USER_CREATED, value: boolean }
    | { id: ApFlagId.WEBHOOK_URL_PREFIX, value: string }
    | { id: ApFlagId.TEMPLATES_CATEGORIES, value: TemplateCategory[] }