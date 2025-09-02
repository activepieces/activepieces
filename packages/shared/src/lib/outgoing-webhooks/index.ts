import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, DiscriminatedUnion } from '../common'

export enum OutgoingWebhookEventType {
    RUN_FAILED = 'RUN_FAILED',
}

export enum OutgoingWebhookScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

const OutgoingWebhookBase = {
    ...BaseModelSchema,
    platformId: Type.String(),
    events: Type.Array(Type.Enum(OutgoingWebhookEventType)),
    url: Type.String(),
}

const OutgoingWebhookPlatformScope = Type.Object({
    ...OutgoingWebhookBase,
    scope: Type.Literal(OutgoingWebhookScope.PLATFORM),
})

const OutgoingWebhookProjectScope = Type.Object({
    ...OutgoingWebhookBase,
    scope: Type.Literal(OutgoingWebhookScope.PROJECT),
    projectId: Type.String(),
})

export const OutgoingWebhook = DiscriminatedUnion('scope', [
    OutgoingWebhookPlatformScope,
    OutgoingWebhookProjectScope,
])

export type OutgoingWebhook = Static<typeof OutgoingWebhook>

export * from './dto'
