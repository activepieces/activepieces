import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'

export const WebhookUrlParams = Type.Object({
    flowId: ApId,
})

export type WebhookUrlParams = Static<typeof WebhookUrlParams>

export const WebhookUrlParamsWithEnvironment = Type.Object({
    environment: Type.String(),
    identifier: Type.String(),
})

export type WebhookUrlParamsWithEnvironment = Static<typeof WebhookUrlParamsWithEnvironment>
