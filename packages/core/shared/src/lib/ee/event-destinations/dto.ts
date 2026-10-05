import { z } from 'zod'
import { ApplicationEventName } from '../audit-events'

export enum EventDestinationScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export enum EventDestinationFormat {
    RAW = 'RAW',
    OTLP_JSON = 'OTLP_JSON',
    OTLP_PROTOBUF = 'OTLP_PROTOBUF',
}

export const ListPlatformEventDestinationsRequestBody = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
})

export type ListPlatformEventDestinationsRequestBody = z.infer<typeof ListPlatformEventDestinationsRequestBody>

export const CreatePlatformEventDestinationRequestBody = z.object({
    events: z.array(z.enum(ApplicationEventName)),
    url: z.url(),
    enabled: z.boolean().optional(),
    format: z.enum(EventDestinationFormat).optional(),
})

export type CreatePlatformEventDestinationRequestBody = z.infer<typeof CreatePlatformEventDestinationRequestBody>

export const UpdatePlatformEventDestinationRequestBody = CreatePlatformEventDestinationRequestBody

export type UpdatePlatformEventDestinationRequestBody = z.infer<typeof UpdatePlatformEventDestinationRequestBody>

export const TestPlatformEventDestinationRequestBody = z.object({
    url: z.url(),
    event: z.enum(ApplicationEventName).optional(),
})

export type TestPlatformEventDestinationRequestBody = z.infer<typeof TestPlatformEventDestinationRequestBody>
