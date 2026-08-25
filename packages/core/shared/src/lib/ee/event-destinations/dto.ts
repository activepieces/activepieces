import { z } from 'zod'
import { ApplicationEventName } from '../audit-events'

export enum EventDestinationScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export const ListPlatformEventDestinationsRequestBody = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
})

export type ListPlatformEventDestinationsRequestBody = z.infer<typeof ListPlatformEventDestinationsRequestBody>



export const CreatePlatformEventDestinationRequestBody = z.object({
    events: z.array(z.nativeEnum(ApplicationEventName)),
    url: z.string().url(),
})


export type CreatePlatformEventDestinationRequestBody = z.infer<typeof CreatePlatformEventDestinationRequestBody>

export const UpdatePlatformEventDestinationRequestBody = CreatePlatformEventDestinationRequestBody

export type UpdatePlatformEventDestinationRequestBody = z.infer<typeof UpdatePlatformEventDestinationRequestBody>

export const TestPlatformEventDestinationRequestBody = z.object({
    url: z.url(),
    event: z.enum(ApplicationEventName).optional(),
})

export type TestPlatformEventDestinationRequestBody = z.infer<typeof TestPlatformEventDestinationRequestBody>
