import { Static, Type } from '@sinclair/typebox'
import { ApplicationEventName } from '../audit-events'

export enum OutgoingWebhookScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export const ListPlatformOutgoingWebhooksRequestBody = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
})

export type ListPlatformOutgoingWebhooksRequestBody = Static<typeof ListPlatformOutgoingWebhooksRequestBody>



export const CreatePlatformOutgoingWebhookRequestBody = Type.Object({
    events: Type.Array(Type.Enum(ApplicationEventName)),
    url: Type.String({ format: 'uri' }),
})


export type CreatePlatformOutgoingWebhookRequestBody = Static<typeof CreatePlatformOutgoingWebhookRequestBody>

export const UpdatePlatformOutgoingWebhookRequestBody = CreatePlatformOutgoingWebhookRequestBody

export type UpdatePlatformOutgoingWebhookRequestBody = Static<typeof UpdatePlatformOutgoingWebhookRequestBody>

export const TestPlatformOutgoingWebhookRequestBody = Type.Object({
    url: Type.String({ format: 'uri' }),
})

export type TestPlatformOutgoingWebhookRequestBody = Static<typeof TestPlatformOutgoingWebhookRequestBody>