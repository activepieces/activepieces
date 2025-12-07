import { Static, Type } from '@sinclair/typebox'
import { TemplateCategory } from '../template/template'
import { ApFlagId } from './flag'

export enum UpdateableApFlagId {
    PUBLIC_URL = ApFlagId.PUBLIC_URL,
    TELEMETRY_ENABLED = ApFlagId.TELEMETRY_ENABLED,
    USER_CREATED = ApFlagId.USER_CREATED,
    WEBHOOK_URL_PREFIX = ApFlagId.WEBHOOK_URL_PREFIX,
    TEMPLATES_CATEGORIES = ApFlagId.TEMPLATES_CATEGORIES,
}

export const UpdateFlagRequestParams = Type.Object({
    id: Type.Enum(UpdateableApFlagId),
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
    | { id: UpdateableApFlagId.PUBLIC_URL, value: string }
    | { id: UpdateableApFlagId.TELEMETRY_ENABLED, value: boolean }
    | { id: UpdateableApFlagId.USER_CREATED, value: boolean }
    | { id: UpdateableApFlagId.WEBHOOK_URL_PREFIX, value: string }
    | { id: UpdateableApFlagId.TEMPLATES_CATEGORIES, value: TemplateCategory[] }