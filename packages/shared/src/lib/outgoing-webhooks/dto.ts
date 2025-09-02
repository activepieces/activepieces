import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../common'
import { OutgoingWebhookEventType, OutgoingWebhookScope } from './'

const CreateOutgoingWebhookBase = {
    events: Type.Array(Type.Enum(OutgoingWebhookEventType)),
    url: Type.String(),
}

const CreateOutgoingWebhookPlatformScopeRequestBody = Type.Object({
    ...CreateOutgoingWebhookBase,
    scope: Type.Literal(OutgoingWebhookScope.PLATFORM),
})

const CreateOutgoingWebhookProjectScopeRequestBody = Type.Object({
    ...CreateOutgoingWebhookBase,
    scope: Type.Literal(OutgoingWebhookScope.PROJECT),
    projectId: Type.String(),
})

export const CreateOutgoingWebhookRequestBody = DiscriminatedUnion('scope', [
    CreateOutgoingWebhookPlatformScopeRequestBody,
    CreateOutgoingWebhookProjectScopeRequestBody,
])

export type CreateOutgoingWebhookRequestBody = Static<typeof CreateOutgoingWebhookRequestBody>