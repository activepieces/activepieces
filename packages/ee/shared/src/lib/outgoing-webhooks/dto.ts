import { DiscriminatedUnion } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ApplicationEventName } from '../audit-events'
import { OutgoingWebhookScope } from './types'

const CreateOutgoingWebhookBase = {
    events: Type.Array(Type.Enum(ApplicationEventName)),
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
    CreateOutgoingWebhookProjectScopeRequestBody,
    CreateOutgoingWebhookPlatformScopeRequestBody,
])

export type CreateOutgoingWebhookRequestBody = Static<typeof CreateOutgoingWebhookRequestBody>