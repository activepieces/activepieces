import { Static, Type } from '@sinclair/typebox'
import { ApplicationEventName } from '../audit-events'

export enum EventDestinationScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export const ListPlatformEventDestinationsRequestBody = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
})

export type ListPlatformEventDestinationsRequestBody = Static<typeof ListPlatformEventDestinationsRequestBody>



export const CreatePlatformEventDestinationRequestBody = Type.Object({
    events: Type.Array(Type.Enum(ApplicationEventName)),
    url: Type.String({ format: 'uri' }),
})


export type CreatePlatformEventDestinationRequestBody = Static<typeof CreatePlatformEventDestinationRequestBody>

export const UpdatePlatformEventDestinationRequestBody = CreatePlatformEventDestinationRequestBody

export type UpdatePlatformEventDestinationRequestBody = Static<typeof UpdatePlatformEventDestinationRequestBody>

export const TestPlatformEventDestinationRequestBody = Type.Object({
    url: Type.String({ format: 'uri' }),
})

export type TestPlatformEventDestinationRequestBody = Static<typeof TestPlatformEventDestinationRequestBody>