import { z } from 'zod'
import { formErrors } from '../../form-errors'
import { ApplicationEventName } from '../audit-events'

const HEADER_NAME_PATTERN = /^[A-Za-z0-9!#$%&'*+\-.^_`|~]+$/

const HeaderName = z.string().regex(HEADER_NAME_PATTERN, formErrors.invalidHeaderName)

export enum EventDestinationScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export enum EventDestinationFormat {
    RAW = 'RAW',
    OTLP_JSON = 'OTLP_JSON',
    OTLP_PROTOBUF = 'OTLP_PROTOBUF',
}

export const EventDestinationHeaders = z.record(HeaderName, z.string())

export type EventDestinationHeaders = z.infer<typeof EventDestinationHeaders>

export const EventDestinationHeadersRequest = z.record(HeaderName, z.string().nullable())

export type EventDestinationHeadersRequest = z.infer<typeof EventDestinationHeadersRequest>

export const ListPlatformEventDestinationsRequestBody = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
})

export type ListPlatformEventDestinationsRequestBody = z.infer<typeof ListPlatformEventDestinationsRequestBody>

export const CreatePlatformEventDestinationRequestBody = z.object({
    events: z.array(z.enum(ApplicationEventName)),
    url: z.url(),
    enabled: z.boolean().optional(),
    headers: EventDestinationHeadersRequest.nullish(),
    format: z.enum(EventDestinationFormat).optional(),
})

export type CreatePlatformEventDestinationRequestBody = z.infer<typeof CreatePlatformEventDestinationRequestBody>

export const UpdatePlatformEventDestinationRequestBody = CreatePlatformEventDestinationRequestBody

export type UpdatePlatformEventDestinationRequestBody = z.infer<typeof UpdatePlatformEventDestinationRequestBody>

export const TestPlatformEventDestinationRequestBody = z.object({
    url: z.url(),
    event: z.enum(ApplicationEventName).optional(),
    headers: EventDestinationHeaders.nullish(),
    format: z.enum(EventDestinationFormat).optional(),
})

export type TestPlatformEventDestinationRequestBody = z.infer<typeof TestPlatformEventDestinationRequestBody>

export const TestPlatformEventDestinationResponse = z.object({
    renderedBody: z.unknown(),
    status: z.number().optional(),
    durationMs: z.number(),
    error: z.string().optional(),
})

export type TestPlatformEventDestinationResponse = z.infer<typeof TestPlatformEventDestinationResponse>
