import { z } from 'zod'
import { ApplicationEventName } from './events'

export enum EventDestinationScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export const EventDestination = z.object({
    id: z.string(),
    created: z.string(),
    updated: z.string(),
    platformId: z.string(),
    projectId: z.string().optional().nullable(),
    scope: z.nativeEnum(EventDestinationScope),
    events: z.array(z.nativeEnum(ApplicationEventName)),
    url: z.string(),
})
export type EventDestination = z.infer<typeof EventDestination>

export const CreatePlatformEventDestinationRequestBody = z.object({
    url: z.string().url(),
    events: z.array(z.nativeEnum(ApplicationEventName)),
})
export type CreatePlatformEventDestinationRequestBody = z.infer<typeof CreatePlatformEventDestinationRequestBody>

export const UpdatePlatformEventDestinationRequestBody = z.object({
    url: z.string().url().optional(),
    events: z.array(z.nativeEnum(ApplicationEventName)).optional(),
})
export type UpdatePlatformEventDestinationRequestBody = z.infer<typeof UpdatePlatformEventDestinationRequestBody>

export const TestPlatformEventDestinationRequestBody = z.object({
    id: z.string(),
})
export type TestPlatformEventDestinationRequestBody = z.infer<typeof TestPlatformEventDestinationRequestBody>
