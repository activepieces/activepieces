import { BaseModelSchema, DiscriminatedUnion } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ApplicationEventName } from '../audit-events/index'
import { OutgoingWebhookScope } from './dto'

const OutgoingWebhookBase = {
    ...BaseModelSchema,
    platformId: Type.String(),
    events: Type.Array(Type.Enum(ApplicationEventName)),
    url: Type.String({ format: 'uri' }),
}

export const OutgoingWebhookPlatformScope = Type.Object({
    ...OutgoingWebhookBase,
    scope: Type.Literal(OutgoingWebhookScope.PLATFORM),
})
export type OutgoingWebhookPlatformScope = Static<typeof OutgoingWebhookPlatformScope>


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
