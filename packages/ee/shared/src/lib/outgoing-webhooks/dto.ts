import { DiscriminatedUnion } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ApplicationEventName } from '../audit-events'

export enum OutgoingWebhookScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export const ListOutgoingWebhooksRequestBody = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
})

export type ListOutgoingWebhooksRequestBody = Static<typeof ListOutgoingWebhooksRequestBody>

const CreateOutgoingWebhookBase = {
    events: Type.Array(Type.Enum(ApplicationEventName)),
    url: Type.String({ format: 'uri' }),
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

export const UpdateOutgoingWebhookRequestBody = Type.Object({
    ...CreateOutgoingWebhookBase,
})

export type UpdateOutgoingWebhookRequestBody = Static<typeof UpdateOutgoingWebhookRequestBody>