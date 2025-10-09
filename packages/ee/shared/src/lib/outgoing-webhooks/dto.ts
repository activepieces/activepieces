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

export const CreateOutgoingWebhookRequestBody = Type.Object({
    events: Type.Array(Type.Enum(ApplicationEventName)),
    url: Type.String({ format: 'uri' }),
    scope: Type.Enum(OutgoingWebhookScope),
})

export type CreateOutgoingWebhookRequestBody = Static<typeof CreateOutgoingWebhookRequestBody>

export const UpdateOutgoingWebhookRequestBody = Type.Partial(CreateOutgoingWebhookRequestBody)

export type UpdateOutgoingWebhookRequestBody = Static<typeof UpdateOutgoingWebhookRequestBody>

export const TestOutgoingWebhookRequestBody = Type.Object({
    url: Type.String({ format: 'uri' }),
})

export type TestOutgoingWebhookRequestBody = Static<typeof TestOutgoingWebhookRequestBody>